import { BattleSync } from './BattleSync';
import { isValid, UITransform, Vec3 } from 'cc';
import { eBattleCamp, eCCharacterID } from './BaseDef';
import { CCharactersManager } from './CharacaterMannager';
import { CCharacter } from './character/character';
import { CBaseRoom } from './room/BaseRoom';

export type FormationSlotKey = number | string;

interface FormationSlot {
    id: eCCharacterID;
    count: number; // 存活总人数，包含在场的一名和所有后备。
    active: CCharacter;
    loading: boolean;
    version: number;
}

// 每个位置独立管理一名在场角色及其后备；不同位置可以使用相同角色 ID。
export class CBattleFormation {
    private slots = new Map<FormationSlotKey, FormationSlot>();
    private disposed = false;
    failed = false;

    constructor(public readonly room: CBaseRoom, public readonly camp: eBattleCamp,
        private initialX: (id: eCCharacterID, slotKey: FormationSlotKey) => number,
        private configure: (char: CCharacter, replacement: boolean, slotKey: FormationSlotKey) => void,
        private onLoss: (id: eCCharacterID, count: number, slotKey: FormationSlotKey) => void = () => {}) {
        CCharactersManager.instance.registerFormation(this);
    }

    getActive(key: FormationSlotKey): CCharacter { return this.slots.get(key)?.active || null; }
    getCount(key: FormationSlotKey): number { return this.slots.get(key)?.count || 0; }
    getActiveCharacters(): CCharacter[] { return Array.from(this.slots.values()).map(slot => slot.active).filter(Boolean); }
    isSlotLoading(key: FormationSlotKey): boolean { return this.slots.get(key)?.loading || false; }
    isLoading(): boolean { return Array.from(this.slots.values()).some(slot => slot.loading); }

    // order 按前排到后排排列；我方朝左，英雄朝右。
    getLineupPositions(order: CCharacter[] = this.getActiveCharacters()): Map<CCharacter, number> {
        const bounds = this.room.tfBase;
        const layer = this.room.nodeCharLayer.getComponent(UITransform);
        const hero = this.camp === eBattleCamp.ebcHero;
        const edge = hero ? -bounds.width * bounds.anchorX : bounds.width * (1 - bounds.anchorX);
        let cursor = layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(new Vec3(edge, 0, 0))).x
            + (hero ? 16 : -16);
        const positions = new Map<CCharacter, number>();
        let previousHalf = 0;
        for (const char of [...order].reverse()) {
            const half = char.node.getComponent(UITransform).width * Math.abs(char.node.scale.x) / 2;
            // 我方压掉贴图留白，按身体宽度的 75% 紧密排列，不改变角色实际尺寸。
            // 最后排仍用完整半宽贴住右侧留边，避免身体超出房间。
            const distance = positions.size === 0 ? half
                : hero ? previousHalf + half + 10 : (previousHalf + half) * 0.75;
            cursor += hero ? distance : -distance;
            positions.set(char, cursor);
            previousHalf = half;
        }
        return positions;
    }
    hasForces(): boolean {
        return !this.disposed && Array.from(this.slots.values())
            .some(slot => slot.count > 0 && (slot.loading || slot.active?.IsAlive()));
    }

    async setCount(id: eCCharacterID, count: number) {
        await this.setSlotCount(id, id, count);
    }

    // 默认以角色 ID 为位置键，兼容我方部署；队伍配置以每条记录的序号为独立键。
    async setSlotCount(key: FormationSlotKey, id: eCCharacterID, count: number) {
        if (this.disposed) return;
        let slot = this.slots.get(key);
        if (slot && slot.id !== id) throw new Error(`编制位置 ${key} 的角色 ID 不一致`);
        if (!slot) {
            slot = { id, count: 0, active: null, loading: false, version: 0 };
            this.slots.set(key, slot);
        }
        slot.count = Math.max(0, Math.floor(count));
        if (slot.count === 0) {
            ++slot.version;
            slot.loading = false;
            if (slot.active) {
                slot.active.onBattleDeath = null;
                CCharactersManager.instance.DeleteCharater(slot.active);
                slot.active = null;
            }
        } else if (!slot.active && !slot.loading) {
            await this.spawn(key, slot, false);
        }
    }

    async removeSlotForCharacter(char: CCharacter) {
        for (const [key, slot] of this.slots) {
            if (slot.active === char) {
                await this.setSlotCount(key, slot.id, 0);
                return;
            }
        }
    }

    getSpawnX(): number {
        const bounds = this.room.tfBase;
        const layer = this.room.nodeCharLayer.getComponent(UITransform);
        const x = this.camp === eBattleCamp.ebcHero ? -bounds.width * bounds.anchorX
            : bounds.width * (1 - bounds.anchorX);
        return layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(new Vec3(x, 0, 0))).x
            + (this.camp === eBattleCamp.ebcHero ? -100 : 100);
    }

    private async spawn(key: FormationSlotKey, slot: FormationSlot, replacement: boolean) {
        const id = slot.id;
        slot.loading = true;
        const version = ++slot.version;
        try {
            const char = await CCharactersManager.instance.CreateChacater4room(id, this.room);
            if (this.disposed || slot.version !== version || !isValid(this.room.node, true)) {
                CCharactersManager.instance.DeleteCharater(char);
                return;
            }
            slot.active = char;
            char.nCamp = this.camp;
            char.node.parent = this.room.nodeCharLayer;
            char.node.y = 0;
            char.setPosition(replacement ? this.getSpawnX() : this.initialX(id, key));
            if (this.camp === eBattleCamp.ebcHero) char.setDirection2Right();
            else char.setDirection2Left();
            char.setInBattle(true);
            char.onBattleDeath = dead => {
                if (this.disposed || slot.active !== dead) return;
                BattleSync.instance.died(dead);
                dead.onBattleDeath = null;
                slot.active = null;
                --slot.count;
                this.onLoss(id, slot.count, key);
                if (slot.count > 0) void this.spawn(key, slot, true);
            };
            BattleSync.instance.bind(char, this.camp === eBattleCamp.ebcHero ? 'enemy' : 'own', this.room.index, key);
            this.configure(char, replacement, key);
        } catch (error) {
            if (!this.disposed && slot.version === version) {
                this.failed = true;
                console.error('战斗编制角色创建失败', id, error);
            }
        } finally {
            if (slot.version === version) slot.loading = false;
        }
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        for (const slot of this.slots.values()) {
            ++slot.version;
            if (slot.active) {
                slot.active.onBattleDeath = null;
                CCharactersManager.instance.DeleteCharater(slot.active);
            }
        }
        this.slots.clear();
        CCharactersManager.instance.unregisterFormation(this);
    }
}
