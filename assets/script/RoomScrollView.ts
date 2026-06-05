import { _decorator, Component, Node, Event, ScrollView, Vec2 } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('RoomScrollView')
export class RoomScrollView extends Component {

    scrollView: ScrollView = null;

    protected onLoad(): void {
        this.scrollView = this.node.getComponent(ScrollView);
    }

    start() {

    }

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_room_expand, this.onRoomStatueChange, this);
        this.node.on(UniEvent.on_room_restore, this.onRoomStatueChange, this);
        this.node.on(UniEvent.on_rooms_init_finish, this.onRoomsInitFinish, this);
    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_room_expand, this.onRoomStatueChange, this);
        this.node.off(UniEvent.on_room_restore, this.onRoomStatueChange, this);
        this.node.off(UniEvent.on_rooms_init_finish, this.onRoomsInitFinish, this);
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

    private onRoomsInitFinish(event: CustomEvent) {
        this.scrollView.scrollToOffset(new Vec2(0, 0), 0);
    }

    // protected onDestroy(): void {
    //     this.stopListnerEvent();
    // }

    private onRoomStatueChange(event: CustomEvent) {
        // event.target 可以获取到最初触发该事件的子节点
        // console.log("触发事件数据:", event.target.name);
        console.log("Y轴偏移:", event.detail.offset);
        this.scheduleOnce(() => {
            if (event.type == UniEvent.on_room_expand) {
                const info = event.detail;

                const offset = new Vec2(0, info.offset);

                this.scrollView.scrollToOffset(offset, 0.5);
            }
        }, 0.1)


    }

    update(deltaTime: number) {

    }
}


