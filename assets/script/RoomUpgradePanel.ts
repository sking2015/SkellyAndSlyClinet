import { _decorator, Component, Node } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('CRoomUpgradePanel')
export default class CRoomUpgradePanel extends Component {

    //当前描述房间index
    nCurRoomIndex: number = -1;

    start() {

    }

    onOpen() {
        this.node.active = true;
    }

    onClose() {
        this.node.active = false;
    }

    setRoomIndex(idx: number) {
        this.nCurRoomIndex = idx;
    }

    onClickConfirm() {

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_room_upgrade, true, { roomIdx: this.nCurRoomIndex }))
        this.onClose();
    }

    update(deltaTime: number) {

    }
}


