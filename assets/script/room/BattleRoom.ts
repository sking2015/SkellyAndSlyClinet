import { BattleSync } from '../BattleSync';
import { invasionState } from '../InvasionState';
import type { BattleState } from '../Protocol';
import { gameStateMgr } from '../GameStateMgr';
import { _decorator, Component, Node, EventTouch, tween, Tween, UIOpacity, Sprite, SpriteFrame, Label, UITransform, Vec3, isValid } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { setNodeVisibleWithFade } from '../common/common';
import { CTroopInfo } from '../TroopInfo';
import { CLordInfo } from '../LordInfo';
import { eCCharacterID, eBattleCamp, eDirction, eRoomType, mapTroop2ID } from '../BaseDef';
import { CGlobalData } from '../GlobalData';
import { CCharacter } from '../character/character';
import { CBattleFormation } from '../BattleFormation';
import { CBattleRole } from '../character/battlerole';
import { getCharacterCombatPower } from '../CombatPower';

const { ccclass, property } = _decorator;

const COMBAT_PANEL_Y_EXPANDED = 24; // 扩展面板展开时的 Y 坐标
const COMBAT_PANEL_Y_COLLAPSED = 88; // 扩展面板收起时的 Y 坐标

const GUARD_POS = 0;
const SOLDIER_POS = 70;
const ARCHER_POS = 140;
const MAGE_POS = 210;

@ccclass('CBattleRoom')
export class CBattleRoom extends CBaseRoom {

    @property({ type: Node, tooltip: "房间左上角战力显示面板" })
    nodeCombatDataPanel: Node = null;

    @property({ type: Label, tooltip: "部署部队总量" })
    lblTotalTroops: Label = null;

    @property({ type: Label, tooltip: "当前房间部署的守卫和全部部队总战力" })
    lblCombatNum: Label = null;

    @property({ type: SpriteFrame, tooltip: "小入侵警觉图标" })
    sfExclamation: SpriteFrame = null;

    @property({ type: CLordInfo, tooltip: "房间领主信息" })
    lordInfo: CLordInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（战士）" })
    troopInfoSoldier: CTroopInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（弓箭手）" })
    troopInfoArcher: CTroopInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（法师）" })
    troopInfoMage: CTroopInfo = null;



    nTroopsCapacity: number = 15; // 部队容量,先写死15,以后再上影响值

    eGuardId: eCCharacterID = eCCharacterID.eciNone;
    nSoldierNum: number = 0;
    nArcherNum: number = 0;
    nMageNum: number = 0;


    //战斗角色对像引用，方便后续刷新战斗角色的状态
    charGuard: CCharacter = null;
    charSoldier: CCharacter = null;
    charArcher: CCharacter = null;
    charMage: CCharacter = null;

    private formation: CBattleFormation = null;
    private defensePhase: 'patrol' | 'alert' | 'recovering' | 'forming' | 'ready' | 'battle' = 'patrol';
    private alertRemaining = 0;
    private configurationVersion = 0;
    private checkingConfiguration = false;
    private majorPreparing = false;
    private formationRetry = 0;

    get isConfigurationLocked(): boolean {
        return invasionState.locked || (!this.majorPreparing && this.defensePhase !== 'patrol')
            || !!(gameStateMgr.online && gameStateMgr.isRoomBattleLocked(this.index));
    }
    private slotIds = { charGuard: eCCharacterID.eciNone, charSoldier: eCCharacterID.eciNone,
        charArcher: eCCharacterID.eciNone, charMage: eCCharacterID.eciNone };

    private getFormation(): CBattleFormation {
        if (!this.formation) {
            const position = (id: eCCharacterID) => (mapTroop2ID[1].indexOf(id) >= 0) ? SOLDIER_POS
                : (mapTroop2ID[2].indexOf(id) >= 0) ? ARCHER_POS
                : (mapTroop2ID[3].indexOf(id) >= 0) ? MAGE_POS : GUARD_POS;
            this.formation = new CBattleFormation(this, eBattleCamp.ebcDemon, position, (char, replacement) => {
                const slot = Object.keys(this.slotIds).find(key => this.slotIds[key] === char.eCharId);
                if (slot) this[slot] = char;
                const role = char as CBattleRole;
                if (this.defensePhase === 'recovering') {
                    role.holdDeployment();
                    return;
                }
                if (this.defensePhase === 'battle') {
                    if (replacement) {
                        role.reinforcementTargetX = position(char.eCharId);
                        role.logBattleAttributes('替补出场');
                    }
                } else if (this.defensePhase === 'patrol') {
                    this.startPatrol(role);
                } else {
                    role.holdDeployment();
                    if (invasionState.phase === 'idle') role.showExclamation(this.sfExclamation);
                    if (this.defensePhase !== 'alert') this.formDefenders();
                }
                if (!replacement) char.playEffect();
            }, (id, count) => {
                const data = CGlobalData.instance.getRoomDataByIndex(this.index);
                if ((mapTroop2ID[1].indexOf(id) >= 0)) {
                    this.charSoldier = null;
                    this.nSoldierNum = count;
                    if (data && !gameStateMgr.online) data.nSoldierNum = count;
                } else if ((mapTroop2ID[2].indexOf(id) >= 0)) {
                    this.charArcher = null;
                    this.nArcherNum = count;
                    if (data && !gameStateMgr.online) data.nArcherNum = count;
                } else if ((mapTroop2ID[3].indexOf(id) >= 0)) {
                    this.charMage = null;
                    this.nMageNum = count;
                    if (data && !gameStateMgr.online) data.nMageNum = count;
                } else if (id === this.eGuardId) {
                    this.charGuard = null;
                    this.eGuardId = eCCharacterID.eciNone;
                    // A defeated lord remains assigned and returns after battle.
                }
                this.refreshCombatInfo();
            });
        }
        return this.formation;
    }

    private getDefenders(): CBattleRole[] {
        const ids = Object.keys(this.slotIds).map(key => this.slotIds[key]);
        return ids.filter(id => id !== eCCharacterID.eciNone)
            .map(id => this.formation?.getActive(id) as CBattleRole).filter(role => role?.IsAlive());
    }

    private startPatrol(role: CBattleRole) {
        const layer = this.nodeCharLayer.getComponent(UITransform);
        const toLayer = (x: number) => layer.convertToNodeSpaceAR(this.tfBase.convertToWorldSpaceAR(new Vec3(x, 0, 0))).x;
        const half = role.node.getComponent(UITransform).width * Math.abs(role.node.scale.x) / 2;
        role.startDeploymentPatrol(toLayer(-this.tfBase.width * this.tfBase.anchorX) + half + 24,
            toLayer(this.tfBase.width * (1 - this.tfBase.anchorX)) - half - 24);
    }

    beginMinorInvasion() {
        this.defensePhase = 'alert';
        ++this.configurationVersion;
        const wasOpen = this.bOpneExpandPanel || this.nodeExpandPanel.active;
        this.CloseExpand();
        setNodeVisibleWithFade(this.nodeSwitchExpand, false);
        if (wasOpen) this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_restore, true, { index: this.index }));
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_configuration_locked, true, { roomIndex: this.index }));
        this.alertRemaining = 1.2;
        for (const role of this.getDefenders()) {
            role.refreshFeedAttributes();
            role.holdDeployment();
            role.showExclamation(this.sfExclamation);
        }
    }

    beginMajorPreparation() {
        this.majorPreparing = true;
        this.defensePhase = 'forming';
        this.refreshExpand();
        for (const role of this.getDefenders()) role.refreshFeedAttributes();
        this.formDefenders();
    }

    hasDefendingForces(): boolean { return !!this.formation?.hasForces(); }

    async recoverMajorDefenders(battle: BattleState, readyImmediately = false) {
        this.majorPreparing = false;
        this.defensePhase = 'recovering';
        for (const role of this.getDefenders()) role.holdDeployment();
        const living = battle.units.filter(u => u.side === 'own' && u.source_room_index === this.index && u.alive);
        this.eGuardId = (living.find(u => u.kind === 'lord')?.config_id || eCCharacterID.eciNone) as eCCharacterID;
        this.nSoldierNum = living.filter(u => u.troop_type === 1).length;
        this.nArcherNum = living.filter(u => u.troop_type === 2).length;
        this.nMageNum = living.filter(u => u.troop_type === 3).length;
        await this.refreshGuardRole(); await this.refreshSoldierRole();
        await this.refreshArcherRole(); await this.refreshMageRole();
        this.bindBattleInstances();
        this.formDefenders(readyImmediately);
    }

    restoreMajorDefenders() {
        // Dead lords stay assigned in global state, but cannot respawn during this battle.
        this.majorPreparing = false;
        this.endMinorInvasion();
        for (const role of this.getDefenders()) role.setMP(role._MaxMP);
    }

    lockMajorBattle() {
        this.majorPreparing = false;
        ++this.configurationVersion;
        this.CloseExpand();
        setNodeVisibleWithFade(this.nodeSwitchExpand, false);
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_configuration_locked, true, { roomIndex: this.index }));
    }

    private formDefenders(readyImmediately = false) {
        this.defensePhase = readyImmediately ? 'ready' : 'forming';
        const defenders = this.getDefenders();
        const positions = this.formation?.getLineupPositions(defenders);
        for (const role of defenders) {
            if (readyImmediately) {
                role.setPosition(positions.get(role));
                role.setDirection2Left();
                role.holdDeployment();
            } else role.marchToDeployment(positions.get(role), eDirction.edLeft);
        }
    }

    areDefendersReady(): boolean { return this.defensePhase === 'ready' && !this.formation?.isLoading(); }

    bindBattleInstances() {
        for (const char of this.getDefenders()) BattleSync.instance.bind(char, 'own', this.index);
    }

    startMinorBattle(resuming = false) {
        this.defensePhase = 'battle';
        for (const role of this.getDefenders()) role.startDeploymentBattle(resuming);
    }

    endMinorInvasion() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { root: this.nodeCharLayer }));
        this.defensePhase = 'patrol';
        this.refreshExpand();
        setNodeVisibleWithFade(this.nodeSwitchExpand, true);
        for (const role of this.getDefenders()) {
            role.setHP(role._MaxHP);
            this.startPatrol(role);
        }
    }

    update(dt: number) {
        this.formationRetry = Math.max(0, this.formationRetry - dt);
        if (this.formation?.failed && this.formationRetry <= 0) {
            this.formationRetry = 3;
            void this.formation.retryFailed();
        }
        if (this.defensePhase === 'alert') {
            this.alertRemaining -= dt;
            if (this.alertRemaining <= 0 && this.getDefenders().every(role => !role.isShowingExclamation())) {
                this.formDefenders();
            }
        } else if (this.defensePhase === 'forming' && !this.formation?.isLoading()
            && this.getDefenders().every(role => role.isDeploymentReady())) {
            this.defensePhase = 'ready';
        }
    }

    private async replaceRole(slot: 'charGuard' | 'charSoldier' | 'charArcher' | 'charMage', id: eCCharacterID) {
        const formation = this.getFormation();
        const oldId = this.slotIds[slot];
        this.slotIds[slot] = id;
        if (oldId !== id && oldId !== eCCharacterID.eciNone) {
            void formation.setCount(oldId, 0);
            this[slot] = null;
        }
        if (id === eCCharacterID.eciNone) {
            if (this.defensePhase === 'forming' || this.defensePhase === 'ready') this.formDefenders();
            return;
        }
        const count = slot === 'charSoldier' ? this.nSoldierNum : slot === 'charArcher' ? this.nArcherNum
            : slot === 'charMage' ? this.nMageNum : 1;
        await formation.setCount(id, count);
        const role = formation.getActive(id) as CBattleRole;
        if (role && this.defensePhase === 'patrol') this.startPatrol(role);
    }

    protected onDestroy() {
        this.formation?.dispose();
    }

    start() {
        super.start();
        if (this.roomType !== eRoomType.ertCastleOutSide) this.nodeCombatDataPanel.active = false;

        this.refreshRoomShow();
    }

    async refreshGuardRole() {
        await this.replaceRole('charGuard', this.eGuardId);
    }

    async refreshSoldierRole() {
        await this.replaceRole('charSoldier', this.nSoldierNum > 0 ? mapTroop2ID[1][CGlobalData.instance.nSoldierLevel - 1] : eCCharacterID.eciNone);
    }

    async refreshArcherRole() {
        await this.replaceRole('charArcher', this.nArcherNum > 0 ? mapTroop2ID[2][CGlobalData.instance.nArcherLevel - 1] : eCCharacterID.eciNone);
    }

    async refreshMageRole() {
        await this.replaceRole('charMage', this.nMageNum > 0 ? mapTroop2ID[3][CGlobalData.instance.nMageLevel - 1] : eCCharacterID.eciNone);
    }

    private needsRoleRefresh(slot: 'charGuard' | 'charSoldier' | 'charArcher' | 'charMage',
        id: eCCharacterID, count: number): boolean {
        if (this.slotIds[slot] !== id) return true;
        if (id === eCCharacterID.eciNone) return false;
        if (this.formation?.getCount(id) !== count) return true;
        return !this.formation?.getActive(id) && !this.formation?.isSlotLoading(id);
    }

    refreshExpand() {
        // Reading the same snapshot again must still repair a missing scene entity.
        // During battle only the formation may change its living roster.
        if (this.defensePhase === 'patrol' || this.majorPreparing) {
            const data = CGlobalData.instance;
            this.eGuardId = data.getRoomGuardIdByIndex(this.index);
            this.nSoldierNum = data.getRoomSoldierNumByIndex(this.index);
            this.nArcherNum = data.getRoomArcherNumByIndex(this.index);
            this.nMageNum = data.getRoomMageNumByIndex(this.index);
            if (this.needsRoleRefresh('charGuard', this.eGuardId, this.eGuardId ? 1 : 0)) void this.refreshGuardRole();
            const troops = [
                { slot: 'charSoldier' as const, type: 1, count: this.nSoldierNum, level: data.nSoldierLevel, refresh: () => this.refreshSoldierRole() },
                { slot: 'charArcher' as const, type: 2, count: this.nArcherNum, level: data.nArcherLevel, refresh: () => this.refreshArcherRole() },
                { slot: 'charMage' as const, type: 3, count: this.nMageNum, level: data.nMageLevel, refresh: () => this.refreshMageRole() },
            ];
            for (const troop of troops) {
                const id = troop.count > 0 ? mapTroop2ID[troop.type][troop.level - 1] : eCCharacterID.eciNone;
                if (this.needsRoleRefresh(troop.slot, id, troop.count)) void troop.refresh();
            }
        }
        this.refreshCombatInfo();
    }

    private refreshCombatInfo() {
        //模拟一下血量，后续可以根据兵营里的兵种信息获取真实的血量
        let nSoldierHp = 200;
        let nArcherHp = 100;
        let nMageHp = 100;

        //刷新房间的战力显示
        this.lordInfo.setCharID(this.eGuardId);
        this.troopInfoSoldier.setCount(this.nSoldierNum);
        this.troopInfoArcher.setCount(this.nArcherNum);
        this.troopInfoMage.setCount(this.nMageNum);

        this.lblTotalTroops.string = (this.nSoldierNum + this.nArcherNum + this.nMageNum).toString() + "/" + this.nTroopsCapacity.toString();

        // 按编制人数汇总，包含尚未上场的后备，不依赖异步创建的角色节点。
        const combatPower = getCharacterCombatPower(this.eGuardId)
            + getCharacterCombatPower(eCCharacterID.eciSkullSoldier) * this.nSoldierNum
            + getCharacterCombatPower(eCCharacterID.eciSkullArcher) * this.nArcherNum
            + getCharacterCombatPower(eCCharacterID.eciSkullMage) * this.nMageNum;
        if (this.lblCombatNum) this.lblCombatNum.string = combatPower.toString();

        this.troopInfoSoldier.setHealth(nSoldierHp * this.nSoldierNum);
        this.troopInfoArcher.setHealth(nArcherHp * this.nArcherNum);
        this.troopInfoMage.setHealth(nMageHp * this.nMageNum);
    }


    refreshRoomShow() {
        super.refreshRoomShow();
        // console.log("以后这里应该要放刷新守卫显示的内容");
    }


    onClickLord() {
        if (this.isConfigurationLocked) return;
        const version = this.configurationVersion;
        console.log("点击了房间的领主按钮");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_chars_list, true, {
            roomIndex: this.index, callback: async (charId: eCCharacterID) => {
                if (this.isConfigurationLocked || version !== this.configurationVersion) return;
                console.log("选择了领主角色", charId);
                if (gameStateMgr.online) {
                    if (!(await gameStateMgr.operation('room-change-guard', {
                        room_index: this.index, guard_id: charId,
                    })).ok) return;
                } else CGlobalData.instance.setRoomGuardIdByIndex(this.index, charId);
                this.refreshExpand();

                this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
            }
        }));
    }

    onClickTroop(event: EventTouch, customEventData: string) {
        if (this.isConfigurationLocked) {
            if (gameStateMgr.online && gameStateMgr.isRoomBattleLocked(this.index)) {
                this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                    tips: '服务器仍有未结束战斗，房间暂不可配置，请等待结算',
                }));
            }
            return;
        }
        console.log("点击了房间的小兵按钮", customEventData);

        // this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_panel, true, { roomType: this.roomType, roomIndex: this.index }));
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_troop, true, { troopIndex: customEventData, roomIndex: this.index }));
    }

    onClickConfirm() {
        console.log("点击了房间的确认按钮");
    }

    private logConfiguration(action: string, details: Record<string, unknown> = {}) {
        const battle = gameStateMgr.activeBattle;
        const snapshot = BattleSync.instance.snapshot;
        const serverNow = gameStateMgr.serverNow;
        // Serialize immediately: DevTools otherwise shows objects as they change later.
        console.log('[房间配置诊断] ' + JSON.stringify({
            action, timestamp: new Date().toISOString(), room_index: this.index, room_type: this.roomType,
            online: gameStateMgr.online, state_version: gameStateMgr.stateVersion,
            defense_phase: this.defensePhase, configuration_locked: this.isConfigurationLocked,
            server_locked: !!(gameStateMgr.online && gameStateMgr.isRoomBattleLocked(this.index)),
            checking_configuration: this.checkingConfiguration,
            panel_open: this.bOpneExpandPanel, panel_active: this.nodeExpandPanel?.active,
            node_valid: isValid(this.node, true), node_active: this.node?.activeInHierarchy,
            server_now: serverNow,
            active_battle: battle ? { battle_id: battle.battle_id, status: battle.status,
                room_index: battle.room_index ?? 0, started_at: battle.started_at, expires_at: battle.expires_at,
                remaining_ms: battle.expires_at - serverNow, last_event_seq: battle.last_event_seq } : null,
            local_battle: snapshot ? { battle_id: snapshot.battle_id, status: snapshot.status } : null,
            ...details,
        }));
    }

    onOpenExpand() {
        this.logConfiguration('尝试展开');
        if (this.isConfigurationLocked) {
            this.logConfiguration('战斗锁阻止展开');
            console.warn('[房间展开] 战斗锁阻止展开', { room_index: this.index,
                defense_phase: this.defensePhase, battle_id: gameStateMgr.activeBattle?.battle_id,
                battle_status: gameStateMgr.activeBattle?.status, expires_at: gameStateMgr.activeBattle?.expires_at });
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                tips: '战斗尚未结束或正在等待服务器结算，房间暂不可展开',
            }));
            return;
        }
        super.onOpenExpand();
        this.logConfiguration('面板已展开');
        if (this.roomType === eRoomType.ertCastleOutSide) return;
        console.log("点击展开按钮，展开房间的扩展面板");

        this.stopCombatPanelAnimation();
        setNodeVisibleWithFade(this.nodeCombatDataPanel, true);
        tween(this.nodeCombatDataPanel).to(0.3, { y: COMBAT_PANEL_Y_EXPANDED }, { easing: 'backOut' }).start();
    }

    CloseExpand() {
        const wasOpen = this.bOpneExpandPanel || this.nodeExpandPanel.active;
        super.CloseExpand();
        if (this.roomType === eRoomType.ertCastleOutSide) return;
        if (!wasOpen) {
            return;
        }
        console.log("点击关闭按钮，关闭房间的扩展面板");
        this.stopCombatPanelAnimation();
        setNodeVisibleWithFade(this.nodeCombatDataPanel, false);
        tween(this.nodeCombatDataPanel).to(0.3, { y: COMBAT_PANEL_Y_COLLAPSED }, { easing: 'backIn' }).start();

    }

    private stopCombatPanelAnimation() {
        Tween.stopAllByTarget(this.nodeCombatDataPanel);
    }

    async onClickSetting() {
        this.logConfiguration('点击设置按钮');
        if (this.checkingConfiguration) {
            this.logConfiguration('同步进行中，忽略重复点击');
            return;
        }
        if (gameStateMgr.online && gameStateMgr.isRoomBattleLocked(this.index)) {
            this.checkingConfiguration = true;
            try {
                this.logConfiguration('开始同步战斗状态');
                // state-sync lets the server settle expired battles before checking the lock again.
                const reply = await gameStateMgr.syncState();
                this.logConfiguration('战斗状态同步返回', { ok: reply.ok, code: reply.code });
                if (!isValid(this.node, true)) return;
                if (!reply.ok) {
                    this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                        tips: '战斗状态同步失败，请稍后重试',
                    }));
                    return;
                }
                if (!gameStateMgr.isRoomBattleLocked(this.index) && this.defensePhase !== 'patrol') {
                    this.logConfiguration('服务器已解锁，清理本地战斗状态');
                    this.endMinorInvasion();
                }
            } catch (error) {
                this.logConfiguration('战斗状态同步异常', { error: String(error) });
                console.warn('[房间配置] 同步战斗状态失败', error);
                if (isValid(this.node, true)) this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                    tips: '战斗状态同步失败，请稍后重试',
                }));
                return;
            } finally {
                this.checkingConfiguration = false;
            }
        }
        // onOpenExpand supplies the lock diagnostic and user-facing message if still locked.
        this.logConfiguration(this.bOpneExpandPanel ? '执行收起面板' : '执行打开面板');
        super.onClickSetting();
    }

    onClickRoomUpgrade() {
        if (!this.isConfigurationLocked) super.onClickRoomUpgrade();
    }

    async onUpgrade() {
        if (!this.isConfigurationLocked) await super.onUpgrade();
    }

}


