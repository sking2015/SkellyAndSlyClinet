import { _decorator, Component, instantiate, Node, Prefab, Sprite } from 'cc';
import { COverseerData, CGlobalData } from './GlobalData';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectBtn from './OSSelectBtn';
import { eOverseerType } from './BaseDef';
import { CResManager } from './ResManager';
const { ccclass, property } = _decorator;

@ccclass('OSSelectPanel')
export default class OSSelectPanel extends Component {
    @property({ type: Node, tooltip: "所有备选监工容器" })
    container: Node = null;

    @property({ type: Prefab, tooltip: "监工按钮预制件" })
    prefabOSBtn: Prefab = null;

    @property({ type: Sprite, tooltip: "监工全身像" })
    sprImg: Sprite = null;

    eCurOSType: eOverseerType = eOverseerType.eotNone;

    //当前描述房间index
    nCurRoomIndex: number = -1;


    mapOSBtn: Map<eOverseerType, OSSelectBtn> = new Map();

    start() {
        this.initAllOverseer();
    }

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_click_overseer, this.onSelectOverseer, this);

    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_click_overseer, this.onSelectOverseer, this);
    }

    // protected onLoad(): void {
    //     this.startListnerEvent();
    // }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }

    onSelectOverseer(event: CustomEvent) {
        console.log("监工选择面板触发事件数据:", event);
        this.eCurOSType = event.detail.osType;
        this.refreshSelected();
        this.sprImg.spriteFrame = CResManager.instance.getOSAvatar(this.eCurOSType);
    }

    refreshSelected() {
        this.mapOSBtn.forEach((comBtn: OSSelectBtn, eType: eOverseerType) => {
            comBtn.setSelect(this.eCurOSType === eType);
        })
    }

    initAllOverseer() {
        CGlobalData.instance.foreachOverseers((data: COverseerData) => {
            console.log("看一下初始化overseer", data);
            const btnOS = instantiate(this.prefabOSBtn);
            const comOSBtn = btnOS.getComponent(OSSelectBtn);
            comOSBtn.setOverseer(data);
            this.container.addChild(btnOS);
            this.mapOSBtn.set(data.eType, comOSBtn);
        })
    }

    onClickConfirm() {
        //TODO:这里需要先调用网络调用通知服务器某个房间已经确认更换监工，目前先直接换
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_change_overseer, true, { roomIdx: this.nCurRoomIndex, eOSType: this.eCurOSType }))
        this.onClose();
    }

    setRoomIndex(idx: number) {
        this.nCurRoomIndex = idx;
    }

    onOpen() {
        this.node.active = true;
    }

    onClose() {
        this.node.active = false;
    }

    update(deltaTime: number) {

    }
}


