import { _decorator, Component, Node, ScrollView, Prefab, Label, UITransform, PhysicsSystem2D, EPhysics2DDrawFlags } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectPanel from './OSSelectPanel';
import CRoomUpgradePanel from './RoomUpgradePanel';
import { CGlobalData } from './GlobalData';
import { ResourceShowArea } from './ResourceShowArea';
import { fadeInOut, initGlobalButtonCooldown, setNodeVisibleWithFade } from './common/common';
import { CMALPanel } from './MALPanel';
import { CTroopDeployPanel } from './TroopDeployPanel';
import { CMonsterDetailPanel } from './MonsterDetailPanel';
import { CCharactersManager } from './CharacaterMannager';
import { CTroopUpgrade } from './TroopUpgrade';
import { CItemsPanel } from './ItemsPanel';

import { Roomlist } from './Roomlist';
import { eRoomType, eTroopType } from './BaseDef';

const { ccclass, property } = _decorator;




@ccclass('main')
export class main extends Component {

    @property({ type: Node, tooltip: "所有弹出面板底层遮罩" })
    nodeMask: Node = null;

    @property({ type: OSSelectPanel, tooltip: "监工选择面板" })
    comOSListPanel: OSSelectPanel = null;

    @property({ type: CRoomUpgradePanel, tooltip: "房间升级面板" })
    comRoomUpgradePanel: CRoomUpgradePanel = null;

    @property({ type: CMALPanel, tooltip: "炼金实验室面板" })
    comMALPanel: CMALPanel = null;

    @property({ type: CTroopDeployPanel, tooltip: "部队部署面板" })
    comTroopDeployPanel: CTroopDeployPanel = null;

    @property({ type: CTroopUpgrade, tooltip: "部队升级面板" })
    comTroopUpgradePanel: CTroopUpgrade = null;

    @property({ type: ResourceShowArea, tooltip: "资源显示区域组件" })
    comResShowArea: ResourceShowArea = null;

    @property({ type: CMonsterDetailPanel, tooltip: "魔物属性界面" })
    comMDPanel: CMonsterDetailPanel = null;

    private get comItemsPanel(): CItemsPanel {
        return this.node.getChildByPath('PopPanelLayer/ItemsPanel').getComponent(CItemsPanel);
    }

    @property({ type: Node, tooltip: "tips节点" })
    nodeTips: Node = null;

    @property({ type: Label, tooltip: "tips文本控件" })
    lblTips: Label = null;

    @property({ type: Node, tooltip: "tips背景节点" })
    nodeTipsBg: Node = null;


    @property(ScrollView)
    roomSV: ScrollView = null;

    @property(Roomlist)
    roomList: Roomlist = null;


    tipsQueue: string[] = [];


    bShowTips: boolean = false;
    private guardSelectionRoomIndex = -1;


    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.on(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.on(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.on(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.on(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.on(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.on(UniEvent.on_pop_tips, this.onPopTips, this);
        this.node.on(UniEvent.on_open_room_panel, this.onPopRoomFunPanel, this);
        this.node.on(UniEvent.on_close_room_panel, this.onCloseRoomFunPanel, this);
        this.node.on(UniEvent.on_click_char_ui, this.onPopMonsterDetailPanel, this);
        this.node.on(UniEvent.on_click_troop, this.onPopTroopDeployPanel, this);
        this.node.on(UniEvent.on_refresh_charInfo, this.refreshCharInfo, this);
        this.node.on(UniEvent.on_room_refresh, this.onRoomRefresh, this);
        this.node.on(UniEvent.on_open_chars_list, this.onPopCharsListPanel, this);
        this.node.on(UniEvent.on_room_configuration_locked, this.onRoomConfigurationLocked, this);
        this.node.on(UniEvent.on_open_troop_upgrade, this.onPopTroopUpgradePanel, this);

    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.off(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.off(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.off(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.off(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.off(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.off(UniEvent.on_pop_tips, this.onPopTips, this);
        this.node.off(UniEvent.on_open_room_panel, this.onPopRoomFunPanel, this);
        this.node.off(UniEvent.on_close_room_panel, this.onCloseRoomFunPanel, this);
        this.node.off(UniEvent.on_click_char_ui, this.onPopMonsterDetailPanel, this);
        this.node.off(UniEvent.on_click_troop, this.onPopTroopDeployPanel, this);
        this.node.off(UniEvent.on_refresh_charInfo, this.refreshCharInfo, this);
        this.node.off(UniEvent.on_room_refresh, this.onRoomRefresh, this);
        this.node.off(UniEvent.on_open_chars_list, this.onPopCharsListPanel, this);
        this.node.off(UniEvent.on_room_configuration_locked, this.onRoomConfigurationLocked, this);
        this.node.off(UniEvent.on_open_troop_upgrade, this.onPopTroopUpgradePanel, this);
    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }

    refreshResource(event: CustomEvent) {
        this.comResShowArea.refreshResource();
    }

    onTroopUpgrade() {

    }

    onOpenItemsPanel() {
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comItemsPanel.Show(true);
    }

    onPopTroopUpgradePanel(event: CustomEvent) {
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comTroopUpgradePanel.Show(true);
        this.comTroopUpgradePanel.setTroopType(event.detail.ett);
        this.comTroopUpgradePanel.setBarrackRoom(event.detail.comBR);
    }

    onPopCharsListPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        this.guardSelectionRoomIndex = event.detail.roomIndex;
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comMALPanel.setSelectMode(true);
        this.comMALPanel.Show(true);
        this.comMALPanel.setCallBack4CharButton(event.detail.callback);

    }

    onGatherRes(event: CustomEvent) {
        console.log("onGatherRes", event.detail);
        this.comResShowArea.onGatherRes(event.detail.roomType, event.detail.amount, event.detail.srcNode);
    }

    onChangeOverseer(event: CustomEvent) {
        this.roomList.onChangeOverseer(event.detail.roomIdx, event.detail.eOSId);
    }

    onRoomRefresh(event: CustomEvent) {
        this.roomList.onRoomRefresh(event.detail.roomIdx);
    }

    onRoomUpgrade(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIdx)) return;
        this.roomList.onRoomUpgrade(event.detail.roomIdx);
    }

    onPopOverseerPanel(event: CustomEvent) {
        console.log("onPopOverseerPanel~~", event.detail.roomIdx);
        this.comOSListPanel.setRoomIndex(event.detail.roomIdx);
        this.comOSListPanel.onOpen();
    }

    onPopRoomUpgrade(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIdx)) return;
        this.comRoomUpgradePanel.canConfigure = () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIdx);
        this.comRoomUpgradePanel.setRoomIndex(event.detail.roomIdx);
        this.comRoomUpgradePanel.onOpen();
    }

    onCloseRoomFunPanel() {
        this.guardSelectionRoomIndex = -1;
        setNodeVisibleWithFade(this.nodeMask, false);
    }

    onRoomConfigurationLocked(event: CustomEvent) {
        const index = event.detail.roomIndex;
        if (this.comTroopDeployPanel.roomIndex === index && this.comTroopDeployPanel.node.active) {
            this.comTroopDeployPanel.Show(false);
        }
        if (this.guardSelectionRoomIndex === index) {
            this.comMALPanel.setCallBack4CharButton(null);
            this.comMALPanel.Show(false);
            this.onCloseRoomFunPanel();
        }
        if (this.comRoomUpgradePanel.nCurRoomIndex === index && this.comRoomUpgradePanel.node.active) {
            this.comRoomUpgradePanel.onClose();
        }
    }

    //打开房间功能面板
    onPopRoomFunPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        setNodeVisibleWithFade(this.nodeMask, true);
        console.log("onPopRoomFunPanel~~", event.detail.roomType, event.detail.roomIndex, event.detail.troopIndex);
        switch (event.detail.roomType) {
            case eRoomType.ertAlchemy:
                this.comMALPanel.setSelectMode(false);
                this.guardSelectionRoomIndex = -1;
                // this.comMALPanel.setCallBack4CharButton(null);
                this.comMALPanel.Show(true);
                break;
            case eRoomType.ertBattleRoom:
            case eRoomType.ertDoor:
            case eRoomType.ertCastleOutSide:
                this.comTroopDeployPanel.Show(true);
                this.comTroopDeployPanel.setInfo(event.detail.roomIndex, event.detail.troopIndex,
                    () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIndex));
                break;
            default:
                console.log("不认识的房间类型")
        }
    }

    //打开部队部署面板
    onPopTroopDeployPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comTroopDeployPanel.Show(true);
        let nTroopIndex: number = Number(event.detail.troopIndex);
        this.comTroopDeployPanel.setInfo(event.detail.roomIndex, nTroopIndex as eTroopType,
            () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIndex));
    }

    //打开魔物属性界面
    onPopMonsterDetailPanel(event: CustomEvent) {
        setNodeVisibleWithFade(this.nodeMask, true);
        //this.comMDPanel.setCharID(event.detail.charID);
        this.comMDPanel.setChar(event.detail.data);
        this.comMDPanel.ShowFromOther(event.detail.panel);
    }

    refreshCharInfo(event: CustomEvent) {
        console.log("refreshCharInfo~~", event.detail.charID, event.detail.data);
        this.comMALPanel.refreshCharButton(event.detail.charID);
    }


    onPopTips(event: CustomEvent) {
        this.tipsQueue.push(event.detail.tips);
    }

    popOneTips() {
        if (this.tipsQueue.length === 0) {
            return;
        }

        if (this.bShowTips) {
            return;
        }

        const tips = this.tipsQueue.shift();
        console.log("onPopTips~~", tips);
        this.bShowTips = true;
        this.nodeTips.active = true;

        this.lblTips.string = tips;

        this.scheduleOnce(() => {
            this.nodeTipsBg.getComponent(UITransform).height = this.lblTips.node.getComponent(UITransform).height + 20;
        }, 0.1);


        fadeInOut(this.nodeTips, 0.3, true, () => {
            this.scheduleOnce(() => {
                fadeInOut(this.nodeTips, 0.3, false, () => {
                    this.bShowTips = false;
                });
            }, 2);

        });
    }

    protected onLoad(): void {
        initGlobalButtonCooldown();
    }

    start() {
        this.nodeTips.active = false;
        this.nodeMask.active = false;

        this.comMALPanel.Show(false);
        this.comMDPanel.Close();
        this.comTroopDeployPanel.Show(false);
        this.comItemsPanel.node.active = false;

        PhysicsSystem2D.instance.enable = true;

        CCharactersManager.instance.Init();

        // // 运行游戏后如果能看到绿色框，说明碰撞体大小和位置是对的
        // PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
        //     EPhysics2DDrawFlags.Pair |
        //     EPhysics2DDrawFlags.CenterOfMass |
        //     EPhysics2DDrawFlags.Shape;
    }

    update(deltaTime: number) {
        this.popOneTips();
    }
}


