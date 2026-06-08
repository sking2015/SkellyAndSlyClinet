import { _decorator, Component, Node, ScrollView, Prefab, Label, UITransform } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectPanel from './OSSelectPanel';
import CRoomUpgradePanel from './RoomUpgradePanel';
import { CGlobalData } from './GlobalData';
import { ResourceShowArea } from './ResourceShowArea';
import { fadeInOut, initGlobalButtonCooldown } from './common/common';



import { Roomlist } from './Roomlist';

const { ccclass, property } = _decorator;




@ccclass('main')
export class main extends Component {

    @property({ type: OSSelectPanel, tooltip: "监工选择面板" })
    comOSListPanel: OSSelectPanel = null;

    @property({ type: CRoomUpgradePanel, tooltip: "房间升级面板" })
    comRoomUpgradePanel: CRoomUpgradePanel = null;

    @property({ type: ResourceShowArea, tooltip: "资源显示区域组件" })
    comResShowArea: ResourceShowArea = null;

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


    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.on(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.on(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.on(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.on(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.on(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.on(UniEvent.on_pop_tips, this.onPopTips, this);
    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.off(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.off(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.off(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.off(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.off(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.off(UniEvent.on_pop_tips, this.onPopTips, this);
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

    onGatherRes(event: CustomEvent) {
        console.log("onGatherRes", event.detail);
        this.comResShowArea.onGatherRes(event.detail.roomType, event.detail.amount, event.detail.srcNode);
    }

    onChangeOverseer(event: CustomEvent) {
        this.roomList.onChangeOverseer(event.detail.roomIdx, event.detail.eOSType);
    }

    onRoomUpgrade(event: CustomEvent) {
        this.roomList.onRoomUpgrade(event.detail.roomIdx);
    }

    onPopOverseerPanel(event: CustomEvent) {
        console.log("onPopOverseerPanel~~", event.detail.roomIdx);
        this.comOSListPanel.setRoomIndex(event.detail.roomIdx);
        this.comOSListPanel.onOpen();
    }

    onPopRoomUpgrade(event: CustomEvent) {
        this.comRoomUpgradePanel.setRoomIndex(event.detail.roomIdx);
        this.comRoomUpgradePanel.onOpen();
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
    }

    update(deltaTime: number) {
        this.popOneTips();
    }
}


