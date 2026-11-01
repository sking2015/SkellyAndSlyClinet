import { isValid, UITransform, Vec3 } from 'cc';
import { eBattleCamp, eCCharacterID, eRoomType, eDirction } from './BaseDef';
import { CBattleRole } from './character/battlerole';
import { CCharacter } from './character/character';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { DropConfigData } from './config/DropConfig';
import { HerosData } from './config/Heros';
import { TeamConfigData } from './config/TeamConfig';
import { CGlobalData } from './GlobalData';
import { CBaseRoom } from './room/BaseRoom';
import { CBattleFormation } from './BattleFormation';
import { CBattleRoom } from './room/BattleRoom';

// 小入侵只在城外运行；大入侵的推进和惩罚以后独立接入。
export class CInvasionManager {
    private static _instance: CInvasionManager;
    static get instance(): CInvasionManager {
        return this._instance || (this._instance = new CInvasionManager());
    }

    minInterval = 20;
    maxInterval = 40;
    readonly teamId = 1;

    private room: CBattleRoom = null;
    private remaining = 0;
    private state: 'waiting' | 'preparing' | 'spawning' | 'entering' | 'active' = 'waiting';
    private formation: CBattleFormation = null;
    private get enemies(): CCharacter[] { return this.formation?.getActiveCharacters() || []; }
    private escaped = false;
    private generation = 0;
    private exitX = 0;

    init(rooms: CBaseRoom[]) {
        this.stop();
        this.room = rooms.find(room => room.roomType === eRoomType.ertCastleOutSide) as CBattleRoom || null;
        this.resetTimer();
    }

    stop() {
        ++this.generation;
        this.formation?.dispose();
        this.formation = null;
        if (this.room && isValid(this.room.node, true)) this.room.endMinorInvasion();
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
            if (this.remaining <= 0) {
                this.state = 'preparing';
                this.room.beginMinorInvasion();
            }
            return;
        }
        if (this.state === 'preparing') {
            if (this.room.areDefendersReady()) void this.spawn();
            return;
        }
        if (this.state === 'entering') {
            if (this.room.areDefendersReady() && !this.formation.isLoading()
                && this.enemies.every(char => (char as CBattleRole).isDeploymentReady())) {
                // 同一帧放开双方 AI，英雄入场途中不能被远程技能提前攻击。
                this.room.startMinorBattle();
                for (const char of this.enemies) (char as CBattleRole).startDeploymentBattle();
                this.state = 'active';
            }
            return;
        }
        if (this.state !== 'active') return;
        if (this.formation.failed) {
            this.formation.dispose();
            this.formation = null;
            this.room.endMinorInvasion();
            this.resetTimer();
            return;
        }

        for (const enemy of this.enemies) {
            // 外部移除的角色不能当作击杀结算。
            if (enemy.IsAlive() && (!enemy.node || !isValid(enemy.node))) {
                this.escaped = true;
                void this.formation.setCount(enemy.eCharId, 0);
            } else if (enemy.IsAlive() && enemy.getPosition() >= this.exitX) {
                this.escaped = true;
                // 没有交战而穿过防线时，同角色后备随队离开，不作为击杀。
                void this.formation.setCount(enemy.eCharId, 0);
            }
        }
        const alive = this.formation.hasForces();
        if (!alive) {
            // 先切换状态，保证奖励最多发放一次。死亡演出继续沿用角色原有流程。
            this.resetTimer();
            if (!this.escaped) this.grantReward();
            this.formation.dispose();
            this.formation = null;
            this.room.endMinorInvasion();
        }
    }

    private async spawn() {
        this.state = 'spawning';
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
            const positions = new Map<eCCharacterID, number>();
            const formation = new CBattleFormation(room, eBattleCamp.ebcHero, id => positions.get(id), (char, replacement) => {
                const role = char as CBattleRole;
                role.invasionExitX = this.exitX;
                if (replacement) role.reinforcementTargetX = 0;
                else role.holdDeployment();
            });
            this.formation = formation;
            for (const [heroId, count] of members) {
                const id = (eCCharacterID.eciHerosStart + heroId) as eCCharacterID;
                if (!positions.has(id)) positions.set(id, left - index++ * 100);
                await formation.setCount(id, formation.getCount(id) + count);
                if (generation !== this.generation) return;
                if (formation.failed) throw new Error('入侵队伍创建失败');
            }
            const lineup = formation.getLineupPositions();
            for (const char of this.enemies) {
                (char as CBattleRole).marchToDeployment(lineup.get(char.eCharId), eDirction.edRight);
            }
            this.state = 'entering';
        } catch (error) {
            if (generation !== this.generation) return;
            console.error('[小入侵] 创建队伍失败', error);
            this.formation?.dispose();
            this.formation = null;
            this.room.endMinorInvasion();
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

}
