import { Event } from 'cc';

export class CustomEvent extends Event {
    constructor(name: string, bubbles?: boolean, detail?: any) {
        super(name, bubbles);
        this.detail = detail;
    }
    public detail: any = null;  // 自定义的属性
}


export enum UniEvent {
    on_room_expand = "onRoomExpand",                            //展开房间扩展界面
    on_room_restore = "onRoomRestore",                            //房间恢复，关闭扩展界面
    on_open_ospanel = "onOpenOverseerPanel",                    //打开监工界面
    on_click_overseer = "onClickOverseer",                      //点击监工
    on_change_overseer = "onChangeOverseer",                    //改变监工
    on_open_room_upgrade = "onOpenRoomUpgrade",                 //打开房间升级界面
    on_click_room_upgrade = "onClickRoomUpgrade",                //房间升级
    on_room_unlock = "onRoomUnlock",                              //房间解锁
    on_rooms_init_finish = "onRoomsInitFinish",                 //所有房间初始化完成
    on_resource_change = "onResourceChange",                    //资源发生改变
    on_click_gather_res = "onClickGatherRes",                   //点击资源收集
    on_pop_tips = "onPopTips",                                  //弹出提示
    on_open_room_panel = "onOpenRoomFunPanel",                  //打开房间功能面板
    on_close_room_panel = "onCloseRoomFunPanel",                //关闭房间功能面板
    on_click_char_ui = "onClickCharUI",                         //点击角色按钮
    on_ani_key = "onAniKeyFrame",                               //触发动画关键帧
    on_launche_missile = "onLauncheMissile",                    //发射飞行物
}
