import { _decorator, Component, Node, ScrollView, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectPanel from './OSSelectPanel';
import CRoomUpgradePanel from './RoomUpgradePanel';

import { Roomlist } from './Roomlist';

const { ccclass, property } = _decorator;


@ccclass('main')
export class main extends Component {

    @property({ type: OSSelectPanel, tooltip: "监工选择面板" })
    comOSListPanel: OSSelectPanel = null;

    @property({ type: CRoomUpgradePanel, tooltip: "房间升级面板" })
    comRoomUpgradePanel: CRoomUpgradePanel = null;


    @property(ScrollView)
    roomSV: ScrollView = null;

    @property(Roomlist)
    roomList: Roomlist = null;


    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.on(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.on(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.on(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);



    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.off(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.off(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.off(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
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



    protected onLoad(): void {

    }

    start() {

    }

    update(deltaTime: number) {

    }
}


