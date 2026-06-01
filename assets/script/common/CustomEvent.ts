import { Event } from 'cc';

export class CustomEvent extends Event {
    constructor(name: string, bubbles?: boolean, detail?: any) {
        super(name, bubbles);
        this.detail = detail;
    }
    public detail: any = null;  // 自定义的属性
}


export enum UniEvent {
    on_room_expand = "onRoomExpand",
    on_room_restore = "onRoomRestore",
    on_open_ospanel = "onOpenOverseerPanel",
    on_click_overseer = "onClickOverseer",
    on_change_overseer = "onChangeOverseer",
    on_open_room_upgrade = "onOpenRoomUpgrade",
    on_click_room_upgrade = "onClickRoomUpgrade",
    on_room_unlock = "onRoomUnlock",
    on_rooms_init_finish = "onRoomsInitFinish",
    on_resource_change = "onResourceChange",
    on_click_gather_res = "onClickGatherRes",
}
