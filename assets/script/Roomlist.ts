import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';

import { Room } from './Room';
import { eOverseerType } from './BaseDef';
import { CRoomData, CGlobalData } from './GlobalData';
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
        this.node.on(UniEvent.on_room_unlock, this.onRoomUnLock, this);
    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_room_expand, this.onRoomStatueChange, this);
        this.node.off(UniEvent.on_room_restore, this.onRoomStatueChange, this);
        this.node.off(UniEvent.on_room_unlock, this.onRoomUnLock, this);
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

    onRoomUnLock(event: CustomEvent) {
        const roomIndex = event.detail.roomIdx;
        console.log("room unlock", roomIndex);
        if (roomIndex < 0 || roomIndex >= this.rooms.length) {
            console.error("unlock room error,invalid room index", roomIndex);
            return;
        }

        if (roomIndex + 1 < this.rooms.length) {
            const room = this.rooms[roomIndex + 1];
            console.log("room unlock 22222", room);
            if (room) {
                room.refreshRoomLockShow();
            }
        }
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
        } else {
            console.error("change overseer error,can't room by room index", roomIndex);
        }
    }

    onRoomUpgrade(roomIndex: number) {
        const room = this.rooms[roomIndex];
        if (room) {
            room.onUpgrade();
        } else {
            console.error("change overseer error,can't room by room index", roomIndex);
        }
    }

    start() {
        this.initAllRoom();

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_rooms_init_finish, true));

    }

    initAllRoom() {
        let index: number = 0;
        CGlobalData.instance.foreachRooms((data: CRoomData) => {
            console.log("room data", data);
            const nodeRoom = instantiate(this.prefabRoom);
            nodeRoom.parent = this.node;

            const ComRoom: Room = nodeRoom.getComponent(Room);
            ComRoom.index = index;
            ComRoom.setRoomType(data.eType);
            ComRoom.setRoomLevel(data.level);
            if (data.level > 0) {
                ComRoom.refreshRoomData();
            }


            this.rooms[index] = ComRoom;
            ++index;

        })
        // for (let i = 0; i < 8; ++i) {
        //     const nodeRoom = instantiate(this.prefabRoom);
        //     nodeRoom.parent = this.node;

        //     const ComRoom: Room = nodeRoom.getComponent(Room);
        //     ComRoom.index = i;

        //     this.rooms[i] = ComRoom;
        // }
    }

    update(deltaTime: number) {

    }
}


