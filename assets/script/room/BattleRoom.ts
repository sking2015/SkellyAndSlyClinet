import { BattleSync } from '../BattleSync';
import { gameStateMgr } from '../GameStateMgr';
import { _decorator, Component, Node, EventTouch, tween, Tween, UIOpacity, Sprite, SpriteFrame, Label, UITransform, Vec3 } from 'cc';
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
    private defensePhase: 'patrol' | 'alert' | 'forming' | 'ready' | 'battle' = 'patrol';
    private alertRemaining = 0;
    private configurationVersion = 0;

    get isConfigurationLocked(): boolean { return this.defensePhase !== 'patrol'; }
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
                if (this.defensePhase === 'battle') {
                    if (replacement) role.reinforcementTargetX = position(char.eCharId);
                } else if (this.defensePhase === 'patrol') {
                    this.startPatrol(role);
                } else {
                    role.holdDeployment();
                    role.showExclamation(this.sfExclamation);
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
            role.holdDeployment();
            role.showExclamation(this.sfExclamation);
        }
    }

    private formDefenders() {
        this.defensePhase = 'forming';
        const defenders = this.getDefenders();
        const positions = this.formation?.getLineupPositions(defenders);
        for (const role of defenders) role.marchToDeployment(positions.get(role), eDirction.edLeft);
    }

    areDefendersReady(): boolean { return this.defensePhase === 'ready' && !this.formation?.isLoading(); }

    bindBattleInstances() {
        for (const char of this.getDefenders()) BattleSync.instance.bind(char, 'own', this.index);
    }

    startMinorBattle() {
        this.defensePhase = 'battle';
        for (const role of this.getDefenders()) role.startDeploymentBattle();
    }

    endMinorInvasion() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { root: this.nodeCharLayer }));
        this.defensePhase = 'patrol';
        this.refreshExpand();
        setNodeVisibleWithFade(this.nodeSwitchExpand, true);
        for (const role of this.getDefenders()) this.startPatrol(role);
    }

    update(dt: number) {
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

    refreshExpand() {
        console.log("刷新房间扩展面板显示，房间索引", this.index, "守卫角色ID", this.eGuardId);

        if (this.eGuardId != CGlobalData.instance.getRoomGuardIdByIndex(this.index)) {
            this.eGuardId = CGlobalData.instance.getRoomGuardIdByIndex(this.index);
            this.refreshGuardRole();
        }



        if (this.nSoldierNum != CGlobalData.instance.getRoomSoldierNumByIndex(this.index)
            || (this.nSoldierNum > 0 && this.slotIds.charSoldier !== mapTroop2ID[1][CGlobalData.instance.nSoldierLevel - 1])) {
            this.nSoldierNum = CGlobalData.instance.getRoomSoldierNumByIndex(this.index);
            this.refreshSoldierRole();
        }

        if (this.nArcherNum != CGlobalData.instance.getRoomArcherNumByIndex(this.index)
            || (this.nArcherNum > 0 && this.slotIds.charArcher !== mapTroop2ID[2][CGlobalData.instance.nArcherLevel - 1])) {
            this.nArcherNum = CGlobalData.instance.getRoomArcherNumByIndex(this.index);
            this.refreshArcherRole();
        }

        if (this.nMageNum != CGlobalData.instance.getRoomMageNumByIndex(this.index)
            || (this.nMageNum > 0 && this.slotIds.charMage !== mapTroop2ID[3][CGlobalData.instance.nMageLevel - 1])) {
            this.nMageNum = CGlobalData.instance.getRoomMageNumByIndex(this.index);
            this.refreshMageRole();
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
        if (this.isConfigurationLocked) return;
        console.log("点击了房间的小兵按钮", customEventData);

        // this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_panel, true, { roomType: this.roomType, roomIndex: this.index }));
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_troop, true, { troopIndex: customEventData, roomIndex: this.index }));
    }

    onClickConfirm() {
        console.log("点击了房间的确认按钮");
    }

    onOpenExpand() {
        if (this.isConfigurationLocked) return;
        super.onOpenExpand();
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

    onClickSetting() {
        if (!this.isConfigurationLocked) super.onClickSetting();
    }

    onClickRoomUpgrade() {
        if (!this.isConfigurationLocked) super.onClickRoomUpgrade();
    }

    async onUpgrade() {
        if (!this.isConfigurationLocked) await super.onUpgrade();
    }

}


