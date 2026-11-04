import { gameStateMgr } from './GameStateMgr';
import { CResRoom } from './room/ResRoom';
import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CResManager } from './ResManager';
import { CBaseRoom } from './room/BaseRoom';
import { eCCharacterID } from './BaseDef';
import { CRoomData, CGlobalData } from './GlobalData';
import { CInvasionManager } from './InvasionManager';
import { CCharactersManager } from './CharacaterMannager';
import { CBattleRole } from './character/battlerole';
import { CBattleRoom } from './room/BattleRoom';
const { ccclass, property } = _decorator;

@ccclass('Roomlist')
export class Roomlist extends Component {

    rooms: CBaseRoom[] = [];


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

    onRoomRefresh(roomIndex: number) {
        const room = this.rooms[roomIndex];
        if (room) {
            room.refreshRoomData();
        } else {
            console.error("room refresh error,can't room by room index", roomIndex);
        }
    }

    isRoomConfigurationLocked(roomIndex: number): boolean {
        const room = this.rooms[roomIndex];
        return room instanceof CBattleRoom && room.isConfigurationLocked;
    }

    onChangeOverseer(roomIndex: number, eOSId: eCCharacterID) {
        const room = this.rooms[roomIndex];
        if (room) {
            room.onSelectOverseer(eOSId);
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
        CInvasionManager.instance.init(this.rooms);

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_rooms_init_finish, true));

    }

    initAllRoom() {
        let index: number = 0;
        CGlobalData.instance.foreachRooms((data: CRoomData) => {
            console.log("room data", data.eType, data);

            const prefabRoom: Prefab = CResManager.instance.getRoomPrefab(data.eType);
            const nodeRoom = instantiate(prefabRoom);
            nodeRoom.parent = this.node;

            const ComRoom: CBaseRoom = nodeRoom.getComponent(CBaseRoom);
            ComRoom.index = index;
            ComRoom.setRoomType(data.eType);
            ComRoom.setRoomLevel(data.level);
            if (data.level > 0) {
                ComRoom.setStock(data.nStock);
                ComRoom.refreshRoomData();
                ComRoom.unlock();
                ComRoom.onUnlock();
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

    private appliedRoomVersions = new Map<number, number>();
    update(deltaTime: number) {
        if (gameStateMgr.online) {
            for (const room of this.rooms) {
                if (this.appliedRoomVersions.get(room.index) === gameStateMgr.stateVersion) continue;
                if (room.authorityBusy || (room instanceof CBattleRoom && room.isConfigurationLocked)
                    || (room instanceof CResRoom && room.isGathering)) { continue; }
                const data = CGlobalData.instance.getRoomDataByIndex(room.index);
                if (!data) continue;
                room.roomLevel = data.level;
                room.refreshRoomLevel();
                room.setStock(data.nStock);
                if (room instanceof CResRoom && room.eCCharacterID !== data.eOSId) void room.setOverseer(data.eOSId);
                if (data.level > 0) room.refreshRoomData();
                room.refreshRoomLockShow();
                this.appliedRoomVersions.set(room.index, gameStateMgr.stateVersion);
            }
        }
        CInvasionManager.instance.update(deltaTime);
    }

    onDestroy() {
        CInvasionManager.instance.stop();
        for (const room of this.rooms) {
            CCharactersManager.instance.clearRoomCharacters(room.index);
        }
        CBattleRole.clearExclamationPool();
    }
}


