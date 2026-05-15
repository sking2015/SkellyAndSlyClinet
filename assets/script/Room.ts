import { _decorator, Component, Node } from 'cc';
import { eRoomType, eMineBuffType } from './BaseDef';

const { ccclass, property } = _decorator;



@ccclass('Room')
export class Room extends Component {

    roomType: eRoomType = eRoomType.ertNone; // 房间类型
    start() {

    }

    addBuff(eMBT: eMineBuffType) {

    }

    setRoomType(type: eRoomType) {
        this.roomType = type;
    }

    update(deltaTime: number) {

    }
}


