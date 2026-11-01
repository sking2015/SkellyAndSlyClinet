import { isValid, UITransform, Vec3 } from 'cc';
import { eBattleCamp, eCCharacterID, eRoomType } from './BaseDef';
import { CCharactersManager } from './CharacaterMannager';
import { CBattleRole } from './character/battlerole';
import { CCharacter } from './character/character';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { DropConfigData } from './config/DropConfig';
import { HerosData } from './config/Heros';
import { TeamConfigData } from './config/TeamConfig';
import { CGlobalData } from './GlobalData';
import { CBaseRoom } from './room/BaseRoom';

// 小入侵只在城外运行；大入侵的推进和惩罚以后独立接入。
export class CInvasionManager {
    private static _instance: CInvasionManager;
    static get instance(): CInvasionManager {
        return this._instance || (this._instance = new CInvasionManager());
    }

    minInterval = 20;
    maxInterval = 40;
    readonly teamId = 1;

    private room: CBaseRoom = null;
    private remaining = 0;
    private state: 'waiting' | 'spawning' | 'active' = 'waiting';
    private enemies: CCharacter[] = [];
    private escaped = false;
    private generation = 0;
    private exitX = 0;

    init(rooms: CBaseRoom[]) {
        this.stop();
        this.room = rooms.find(room => room.roomType === eRoomType.ertCastleOutSide) || null;
        this.resetTimer();
    }

    stop() {
        ++this.generation;
        for (const enemy of this.enemies) this.removeEnemy(enemy);
        this.enemies = [];
        this.room = null;
        this.state = 'waiting';
    }

    private resetTimer() {
        const min = Math.max(0.1, this.minInterval);
        this.remaining = min + Math.random() * (Math.max(min, this.maxInterval) - min);
        this.state = 'waiting';
    }

    update(dt: number) {
        if (!this.room || !isValid(this.room.node) || !this.room.node.activeInHierarchy || this.room.roomLevel <= 0) return;
        if (this.state === 'waiting') {
            this.remaining -= dt;
            if (this.remaining <= 0) void this.spawn();
            return;
        }
        if (this.state !== 'active') return;

        for (const enemy of this.enemies) {
            // 外部移除的角色不能当作击杀结算。
            if (enemy.IsAlive() && (!enemy.node || !isValid(enemy.node))) {
                this.escaped = true;
                this.removeEnemy(enemy);
            } else if (enemy.IsAlive() && enemy.getPosition() >= this.exitX) {
                this.escaped = true;
                this.removeEnemy(enemy);
            }
        }
        const alive = this.enemies.some(enemy => enemy.IsAlive() && enemy.node && isValid(enemy.node));
        if (!alive) {
            // 先切换状态，保证奖励最多发放一次。死亡演出继续沿用角色原有流程。
            this.resetTimer();
            if (!this.escaped) this.grantReward();
            this.enemies = [];
        }
    }

    private async spawn() {
        this.state = 'spawning';
        this.enemies = [];
        this.escaped = false;
        const generation = this.generation;
        const room = this.room;
        try {
            const team = TeamConfigData[this.teamId];
            if (!team || team.TeamType !== 'Minor') throw new Error('小入侵队伍配置无效');
            const members = this.parsePairs(team.Members);
            for (const [id] of members) {
                if (!HerosData[id]) throw new Error(`英雄配置不存在: ${id}`);
            }
            const bounds = room.tfBase;
            const layer = room.nodeCharLayer.getComponent(UITransform);
            const toLayer = (x: number) => layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(new Vec3(x, 0, 0))).x;
            const left = toLayer(-bounds.width * bounds.anchorX) - 80;
            this.exitX = toLayer(bounds.width * (1 - bounds.anchorX)) + 100;
            let index = 0;
            for (const [heroId, count] of members) {
                for (let n = 0; n < count; n++) {
                    const enemy = await CCharactersManager.instance.CreateChacater4room(
                        (eCCharacterID.eciHerosStart + heroId) as eCCharacterID, room);
                    if (generation !== this.generation || !isValid(room.node, true)) {
                        this.removeEnemy(enemy);
                        return;
                    }
                    this.enemies.push(enemy);
                    const role = enemy as CBattleRole;
                    role.nCamp = eBattleCamp.ebcHero;
                    role.invasionExitX = this.exitX;
                    role.node.parent = room.nodeCharLayer;
                    role.node.y = 0;
                    role.setPosition(left - index++ * 65);
                    role.setDirection2Right();
                    role.setInBattle(true);
                }
            }
            this.state = 'active';
        } catch (error) {
            if (generation !== this.generation) return;
            console.error('[小入侵] 创建队伍失败', error);
            for (const enemy of this.enemies) this.removeEnemy(enemy);
            this.enemies = [];
            this.resetTimer();
        }
    }

    private parsePairs(content: string): [number, number][] {
        return content.split(',').map(entry => {
            const pair = entry.split(':').map(Number);
            if (pair.length !== 2 || !pair.every(value => Number.isSafeInteger(value) && value > 0)) {
                throw new Error(`入侵配置格式错误: ${content}`);
            }
            return [pair[0], pair[1]] as [number, number];
        });
    }

    private grantReward() {
        try {
            const dropId = TeamConfigData[this.teamId].DropID;
            const drop = DropConfigData[dropId];
            if (!drop) throw new Error(`掉落配置不存在: ${dropId}`);
            const rewards = this.parsePairs(drop.DropContent);
            const items = CGlobalData.instance.mgrItem;
            for (const [id, count] of rewards) {
                const item = items.getItem(id);
                if (item) item.itemNum += count;
                else items.createItem(id, count);
            }
            this.room.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));
            console.log('[小入侵] 剿灭奖励已入包', rewards);
        } catch (error) {
            console.error('[小入侵] 奖励配置错误', error);
        }
    }

    private removeEnemy(enemy: CCharacter) {
        CCharactersManager.instance.DeleteCharater(enemy);
    }
}
