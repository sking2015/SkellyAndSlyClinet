import { _decorator, Component, Node } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { UniEvent } from '../common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('CFeedRoom')
export class CFeedRoom extends CBaseRoom {
    start() {
        super.start();
    }

    onClickSetting() {
        console.log("click setting");
        //实验室没有扩展面板，需要单独打开功能面板
        // this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_panel, true, { roomType: this.roomType, roomIndex: this.index }));

    }

    update(deltaTime: number) {

    }
}


