import { isValid, UITransform, Vec3 } from 'cc';
import { eBattleCamp, eCCharacterID } from './BaseDef';
import { CCharactersManager } from './CharacaterMannager';
import { CCharacter } from './character/character';
import { CBaseRoom } from './room/BaseRoom';

interface FormationSlot {
    count: number; // 存活总人数，包含在场的一名和所有后备。
    active: CCharacter;
    loading: boolean;
    version: number;
}

// 每房间、每阵营一份编制；相同角色 ID 只创建一个存活实体。
export class CBattleFormation {
    private slots = new Map<eCCharacterID, FormationSlot>();
    private disposed = false;
    failed = false;

    constructor(public readonly room: CBaseRoom, public readonly camp: eBattleCamp,
        private initialX: (id: eCCharacterID) => number,
        private configure: (char: CCharacter, replacement: boolean) => void,
        private onLoss: (id: eCCharacterID, count: number) => void = () => {}) {
        CCharactersManager.instance.registerFormation(this);
    }

    getActive(id: eCCharacterID): CCharacter { return this.slots.get(id)?.active || null; }
    getCount(id: eCCharacterID): number { return this.slots.get(id)?.count || 0; }
    getActiveCharacters(): CCharacter[] { return Array.from(this.slots.values()).map(slot => slot.active).filter(Boolean); }
    isLoading(): boolean { return Array.from(this.slots.values()).some(slot => slot.loading); }

    // order 按前排到后排排列；我方朝左，英雄朝右。以身体宽度留出间隔。
    getLineupPositions(order: CCharacter[] = this.getActiveCharacters()): Map<eCCharacterID, number> {
        const bounds = this.room.tfBase;
        const layer = this.room.nodeCharLayer.getComponent(UITransform);
        const hero = this.camp === eBattleCamp.ebcHero;
        const edge = hero ? -bounds.width * bounds.anchorX : bounds.width * (1 - bounds.anchorX);
        let cursor = layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(new Vec3(edge, 0, 0))).x
            + (hero ? 16 : -16);
        const positions = new Map<eCCharacterID, number>();
        for (const char of [...order].reverse()) {
            const half = char.node.getComponent(UITransform).width * Math.abs(char.node.scale.x) / 2;
            cursor += hero ? half : -half;
            positions.set(char.eCharId, cursor);
            cursor += hero ? half + 10 : -half - 10;
        }
        return positions;
    }
    hasForces(): boolean {
        return !this.disposed && Array.from(this.slots.values())
            .some(slot => slot.count > 0 && (slot.loading || slot.active?.IsAlive()));
    }

    async setCount(id: eCCharacterID, count: number) {
        if (this.disposed) return;
        let slot = this.slots.get(id);
        if (!slot) {
            slot = { count: 0, active: null, loading: false, version: 0 };
            this.slots.set(id, slot);
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
            await this.spawn(id, slot, false);
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

    private async spawn(id: eCCharacterID, slot: FormationSlot, replacement: boolean) {
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
            char.setPosition(replacement ? this.getSpawnX() : this.initialX(id));
            if (this.camp === eBattleCamp.ebcHero) char.setDirection2Right();
            else char.setDirection2Left();
            char.setInBattle(true);
            char.onBattleDeath = dead => {
                if (this.disposed || slot.active !== dead) return;
                dead.onBattleDeath = null;
                slot.active = null;
                --slot.count;
                this.onLoss(id, slot.count);
                if (slot.count > 0) void this.spawn(id, slot, true);
            };
            this.configure(char, replacement);
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
