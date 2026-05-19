import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';

import { Room } from './Room';
import { eOverseerType } from './BaseDef';
const { ccclass, property } = _decorator;

@ccclass('Roomlist')
export class Roomlist extends Component {
    @property({
        type: Prefab,
        tooltip: "房间预制件"
    })
    prefabRoom: Prefab = null;


    rooms: Room[] = [];

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_room_expand, this.onRoomStatueChange, this);
        this.node.on(UniEvent.on_room_restore, this.onRoomStatueChange, this);
    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_room_expand, this.onRoomStatueChange, this);
        this.node.off(UniEvent.on_room_restore, this.onRoomStatueChange, this);
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

    onRoomStatueChange(event: CustomEvent) {
        if (event.type == UniEvent.on_room_expand) {
            const info = event.detail;
            for (let i = 0; i < this.rooms.length; ++i) {
                const room = this.rooms[i];
                if (room.index != info.index) {
                    room.CloseExpand();
                }
            }
        }
    }

    onChangeOverseer(roomIndex: number, eOSType: eOverseerType) {
        const room = this.rooms[roomIndex];
        if (room) {
            room.onSelectOverseer(eOSType);
        }
    }

    start() {
        this.initAllRoom();

    }

    initAllRoom() {
        for (let i = 0; i < 8; ++i) {
            const nodeRoom = instantiate(this.prefabRoom);
            nodeRoom.parent = this.node;

            const ComRoom: Room = nodeRoom.getComponent(Room);
            ComRoom.index = i;

            this.rooms[i] = ComRoom;
        }
    }

    update(deltaTime: number) {

    }
}


