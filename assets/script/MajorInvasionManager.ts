import { isValid, UITransform, Vec3 } from 'cc';
import { invasionState } from './InvasionState';
import { gameStateMgr } from './GameStateMgr';
import { CGlobalData } from './GlobalData';
import { CInvasionManager } from './InvasionManager';
import { BattleSync } from './BattleSync';
import { CBattleFormation, FormationSlotKey } from './BattleFormation';
import { CBattleRole } from './character/battlerole';
import { CBaseRoom } from './room/BaseRoom';
import { CBattleRoom } from './room/BattleRoom';
import { eBattleCamp, eCCharacterID, eDirction } from './BaseDef';
import { TeamConfigData, ITeamConfig } from './config/TeamConfig';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import type { LootSettlement } from './Protocol';

export class CMajorInvasionManager {
    static readonly instance = new CMajorInvasionManager();
    private rooms: CBaseRoom[] = [];
    private route: CBaseRoom[] = [];
    private formation: CBattleFormation = null;
    private team: ITeamConfig = null;
    private floor = 0;
    private phase: 'idle'|'preparing'|'entering'|'active'|'leaving'|'settling' = 'idle';
    private pending = false;
    private generation = 0;
    private retry = 0;
    private checkpointTime = 0;
    private keys = new WeakMap<CBattleRole, FormationSlotKey>();
    private targets = new Map<FormationSlotKey, number>();
    private win = false;
    onVictory: (dropId: number, loot?: LootSettlement) => void;
    get active() { return this.phase !== 'idle'; }
    get ready() {
        return this.phase === 'preparing' && !this.pending && !!this.formation && !this.formation.isLoading()
            && this.enemies.every(role => role.isDeploymentReady())
            && this.battleRooms.every(room => room.areDefendersReady());
    }
    get status() {
        if (this.phase === 'preparing') return this.ready ? '备战中 · 点击开始战斗' : '双方正在就位';
        if (this.phase === 'settling') return '正在确认战斗结果';
        if (this.active) return `大入侵 · 第 ${this.floor + 1} 层`;
        const teams = this.stageTeams();
        return teams.length === 1 ? '' : teams.length ? '本关 Major 队伍配置重复' : '后续关卡未配置';
    }
    private get enemies(): CBattleRole[] { return (this.formation?.getActiveCharacters() || []) as CBattleRole[]; }
    private get battleRooms(): CBattleRoom[] { return this.route.filter(room => room instanceof CBattleRoom) as CBattleRoom[]; }
    private stageTeams() { return Object.keys(TeamConfigData).map(key => TeamConfigData[key]).filter(t => t.TeamType === 'Major' && t.StageID === CGlobalData.instance.nCurStageId); }
    init(rooms: CBaseRoom[]) { this.stop(); this.rooms = rooms; }
    stop() {
        ++this.generation;
        this.formation?.dispose(); this.formation = null;
        this.rooms = []; this.route = []; this.phase = 'idle'; this.pending = false;
        invasionState.phase = 'idle';
    }
    update(dt: number) {
        if (!this.rooms.length) return;
        this.retry = Math.max(0, this.retry - dt);
        if (this.pending || this.retry > 0) return;
        if (this.phase === 'idle') {
            const progress = gameStateMgr.authority?.progress;
            const existing = gameStateMgr.activeBattle;
            const recovering = existing?.invasion_type === 'Major';
            if (!recovering && (!CInvasionManager.instance.isIdle || existing)) return;
            if (!recovering && invasionState.notoriety < 100 && progress?.major_pending !== 1) return;
            const teams = this.stageTeams();
            if (teams.length !== 1) return;
            this.team = teams[0];
            void this.prepare(recovering);
            return;
        }
        if (this.phase === 'preparing' || this.phase === 'settling') {
            if (this.phase === 'preparing') {
                for (const room of this.rooms.filter(room => room.roomLevel > 0 && this.route.indexOf(room) < 0)) {
                    this.route.push(room);
                    if (room instanceof CBattleRoom) room.beginMajorPreparation();
                }
                this.route.sort((a, b) => a.index - b.index);
            }
            if (this.phase === 'settling') void this.settle();
            return;
        }
        if (this.formation?.failed) { void this.formation.retryFailed(); this.retry = 3; return; }
        // Loading substitutes count as living forces and must finish before a floor transition.
        if (!this.formation?.hasForces()) { this.finish(true); return; }
        if (this.phase === 'entering') {
            const room = this.route[this.floor];
            if (this.formation.isLoading() || !this.enemies.every(role => role.isDeploymentReady())) return;
            if (room instanceof CBattleRoom && !room.areDefendersReady()) return;
            if (room instanceof CBattleRoom && room.hasDefendingForces()) {
                room.startMinorBattle();
                for (const enemy of this.enemies) enemy.startDeploymentBattle();
                this.phase = 'active';
            } else this.leaveFloor();
        } else if (this.phase === 'active') {
            const room = this.route[this.floor] as CBattleRoom;
            if (!room.hasDefendingForces()) this.leaveFloor();
            this.checkpointTime += dt;
            if (this.checkpointTime >= 2) {
                this.checkpointTime = 0;
                void this.checkpoint('active');
            }
        } else if (this.phase === 'leaving' && this.enemies.every(role => role.isDeploymentReady()) && !this.formation.isLoading()) {
            if (!this.battleRooms.some(room => room.hasDefendingForces()) || this.floor + 1 >= this.route.length) this.finish(false);
            else {
                ++this.floor;
                this.formation.moveToRoom(this.route[this.floor]);
                this.enterFloor();
            }
        }
    }
    private async prepare(recovering: boolean) {
        const generation = this.generation;
        this.pending = true;
        this.formation?.dispose(); this.formation = null;
        try {
            if (gameStateMgr.online && !recovering) {
                const reply = await gameStateMgr.operation('battle-major-prepare', { team_id: this.team.ID });
                if (!reply.ok) { this.retry = 3; return; }
            }
            if (generation !== this.generation) return;
            this.route = this.rooms.filter(room => room.roomLevel > 0).sort((a, b) => a.index - b.index);
            if (!this.route.length) throw new Error('没有可用入侵路线');
            invasionState.phase = 'preparing'; invasionState.notoriety = 0;
            this.phase = 'preparing'; this.floor = 0;
            if (recovering) {
                await BattleSync.instance.recover();
                if (!await BattleSync.instance.flush()) throw new Error('等待战斗事件恢复');
                if (generation !== this.generation) return;
                const synced = await gameStateMgr.syncState();
                if (generation !== this.generation) return;
                if (!synced.ok) throw new Error('Failed to sync the major invasion checkpoint');
                const battle = gameStateMgr.activeBattle;
                if (!battle) throw new Error('战斗已结束，请同步最新状态');
                BattleSync.instance.adoptMajor(battle);
                this.floor = Math.max(0, this.route.findIndex(r => r.index === (battle.checkpoint?.room_index ?? battle.current_room_index ?? 0)));
                for (const room of this.battleRooms) {
                    await room.recoverMajorDefenders(battle,
                        room === this.route[this.floor] && battle.checkpoint?.phase !== 'leaving');
                    if (generation !== this.generation) return;
                }
            } else for (const room of this.battleRooms) room.beginMajorPreparation();
            const room = this.route[this.floor];
            const snapshot = recovering ? BattleSync.instance.snapshot : null;
            const members = snapshot?.enemy_slots?.map(slot => ({ key: slot.position, id: slot.hero_id,
                count: snapshot.units.filter(u => u.alive && slot.unit_instance_ids.indexOf(u.unit_instance_id) >= 0).length }))
                || this.team.Members.split(',').map((value, index) => {
                    const [id, count] = value.split(':').map(Number); return { key: index + 1, id, count };
                });
            this.formation = new CBattleFormation(room, eBattleCamp.ebcHero, () => this.edge(room, false) - 100,
                (char, replacement, key) => {
                    const role = char as CBattleRole;
                    this.keys.set(role, key); role.invasionExitX = null;
                    if (!recovering) role.applyInvasionLevel(this.team.Level);
                    if (replacement && this.phase === 'active') role.reinforcementTargetX = this.targets.get(key) ?? 0;
                    else {
                        role.holdDeployment();
                        if (replacement) this.enterFloor();
                    }
                });
            for (const member of members) {
                if (!Number.isSafeInteger(member.id) || member.count < 0) throw new Error('Major 编制无效');
                await this.formation.setSlotCount(member.key, (1000 + member.id) as eCCharacterID, member.count);
                if (generation !== this.generation) return;
            }
            if (this.formation.failed) throw new Error('Major 敌军创建失败');
            const resumingExit = snapshot?.checkpoint?.phase === 'leaving';
            const resumingCombat = recovering && !resumingExit && room instanceof CBattleRoom && room.hasDefendingForces();
            this.positionEnemies(resumingCombat);
            if (recovering) {
                invasionState.phase = 'battle';
                for (const defenderRoom of this.battleRooms) defenderRoom.lockMajorBattle();
                this.phase = 'entering';
                this.focusFloor();
                if (resumingExit) {
                    this.leaveFloor();
                }
                BattleSync.instance.restoreMajorCheckpoint();
                if (resumingCombat) {
                    room.startMinorBattle(true);
                    for (const enemy of this.enemies) enemy.startDeploymentBattle(true);
                    this.phase = 'active';
                }
            }
        } catch (error) {
            console.error('[大入侵] 备战失败，可重试', error);
            this.formation?.dispose(); this.formation = null;
            this.phase = 'idle'; invasionState.phase = 'idle'; this.retry = 3;
            if (!gameStateMgr.online) invasionState.notoriety = 100;
            for (const room of this.battleRooms) room.restoreMajorDefenders();
        } finally { if (generation === this.generation) this.pending = false; }
    }
    async startBattle() {
        if (!this.ready) return;
        const generation = this.generation;
        this.pending = true;
        // Block double clicks and in-flight modal callbacks while the server freezes the roster.
        invasionState.phase = 'battle';
        try {
            if (gameStateMgr.online && !await BattleSync.instance.startMajor(this.team.ID)) {
                if (gameStateMgr.activeBattle?.invasion_type === 'Major') {
                    // A retained start request may have committed before its response was lost.
                    this.phase = 'idle'; this.retry = 0;
                } else invasionState.phase = 'preparing';
                return;
            }
            if (generation !== this.generation) return;
            for (const room of this.route) room.CloseExpand();
            for (const room of this.battleRooms) {
                if (gameStateMgr.online) await room.recoverMajorDefenders(BattleSync.instance.snapshot);
                if (generation !== this.generation) return;
                room.lockMajorBattle();
            }
            for (const enemy of this.enemies) BattleSync.instance.bind(enemy, 'enemy', this.route[this.floor].index, this.keys.get(enemy));
            this.phase = 'entering';
            this.focusFloor();
        } catch (error) {
            console.error('[大入侵] 开战失败，等待恢复', error);
            if (!gameStateMgr.activeBattle) invasionState.phase = 'preparing';
            else { this.phase = 'idle'; this.retry = 3; }
        } finally { if (generation === this.generation) this.pending = false; }
    }
    private edge(room: CBaseRoom, right: boolean) {
        const bounds = room.tfBase;
        return room.nodeCharLayer.getComponent(UITransform).convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(
            new Vec3(right ? bounds.width * (1 - bounds.anchorX) : -bounds.width * bounds.anchorX, 0, 0))).x;
    }
    private positionEnemies(readyImmediately = false) {
        const positions = this.formation.getLineupPositions();
        this.targets.clear();
        this.enemies.forEach((role, index) => {
            const target = positions.get(role);
            this.targets.set(this.keys.get(role), target);
            if (readyImmediately) {
                role.setPosition(target);
                role.setDirection2Right();
            } else {
                role.setPosition(this.edge(this.route[this.floor], false) - 100 - index * 90);
                role.marchToDeployment(target, eDirction.edRight);
            }
        });
    }
    private focusFloor() {
        const room = this.route[this.floor];
        room.node.dispatchEvent(new CustomEvent(UniEvent.on_major_floor, true, { offset: room.offset, roomIndex: room.index }));
    }
    private enterFloor() { this.phase = 'entering'; this.positionEnemies(); this.focusFloor(); void this.checkpoint('entering'); }
    private leaveFloor() {
        this.phase = 'leaving';
        const room = this.route[this.floor];
        this.enemies.forEach((role, index) => role.marchToDeployment(this.edge(room, true) + 120 + index * 90, eDirction.edRight));
        void this.checkpoint('leaving');
        room.node.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { root: room.nodeCharLayer }));
    }
    private async checkpoint(phase: 'entering'|'active'|'leaving') {
        if (!gameStateMgr.online || this.pending) return;
        const generation = this.generation;
        this.pending = true;
        try { if (!await BattleSync.instance.checkpointMajor(this.route[this.floor].index, phase)) this.retry = 2; }
        catch (error) { console.error('[大入侵] 快照保存失败，将重试', error); this.retry = 2; }
        finally { if (generation === this.generation) this.pending = false; }
    }
    private finish(win: boolean) { this.win = win; this.phase = 'settling'; invasionState.phase = 'settling'; void this.settle(); }
    private async settle() {
        if (this.pending) return;
        this.pending = true;
        const generation = this.generation;
        try {
            if (gameStateMgr.online) {
                if (!await BattleSync.instance.end(this.win, 'elimination')) { this.retry = 3; return; }
            } else if (this.win) CGlobalData.instance.nCurStageId++;
            else for (const key of ['nCoin','nWood','nMetal','nCrystal','nFood','nSoul']) {
                CGlobalData.instance[key] -= Math.floor(CGlobalData.instance[key] * 0.1);
            }
            if (generation !== this.generation) return;
            this.formation?.dispose(); this.formation = null;
            invasionState.phase = 'idle'; this.phase = 'idle';
            for (const room of this.battleRooms) room.restoreMajorDefenders();
            for (const room of this.route) room.node.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { root: room.nodeCharLayer }));
            this.rooms[0].node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));
            if (this.win) this.onVictory?.(this.team.DropID, BattleSync.instance.lastSettlement?.loot);
            else this.rooms[0].node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: '抵抗入侵失败，六种资源各损失 10%' }));
        } catch (error) { console.error('[大入侵] 结算重试', error); this.retry = 3; }
        finally { if (generation === this.generation) this.pending = false; }
    }
}
