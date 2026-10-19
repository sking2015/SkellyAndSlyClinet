import { _decorator, Component, Node, ScrollView, Vec2, Vec3, UITransform, Layout, isValid } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('RoomScrollView')
export class RoomScrollView extends Component {

    scrollView: ScrollView = null;

    private pendingRoom: Node = null;
    private originalPaddingBottom = 0;

    protected onLoad(): void {
        this.scrollView = this.node.getComponent(ScrollView);
        this.originalPaddingBottom = this.scrollView.content.getComponent(Layout)?.paddingBottom ?? 0;
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
        this.unschedule(this.alignExpandedRoom);
        this.pendingRoom = null;
    }

    private onRoomsInitFinish(event: CustomEvent) {
        this.scrollView.scrollToOffset(new Vec2(0, 0), 0);
    }

    // protected onDestroy(): void {
    //     this.stopListnerEvent();
    // }

    private onRoomStatueChange(event: CustomEvent) {
        this.unschedule(this.alignExpandedRoom);
        this.scrollView.stopAutoScroll();
        this.pendingRoom = event.type === UniEvent.on_room_expand ? event.target as Node : null;
        // 等冒泡事件结束、其他房间收起后，再统一更新布局。
        this.scheduleOnce(this.alignExpandedRoom, 0);
    }

    private alignExpandedRoom = () => {
        const content = this.scrollView.content;
        const layout = content.getComponent(Layout);
        if (!layout) {
            return;
        }

        layout.paddingBottom = this.originalPaddingBottom;
        for (const room of content.children) {
            room.getComponent(Layout)?.updateLayout();
        }
        layout.updateLayout();

        let room = this.pendingRoom;
        if (!room || !isValid(room) || !room.activeInHierarchy) {
            return;
        }
        while (room && room.parent !== content) {
            room = room.parent;
        }
        if (!room) {
            return;
        }

        const contentTransform = content.getComponent(UITransform);
        const roomTransform = room.getComponent(UITransform);
        if (!contentTransform || !roomTransform) {
            return;
        }
        const getOffset = () => {
            const worldTop = roomTransform.convertToWorldSpaceAR(
                new Vec3(0, roomTransform.height * (1 - roomTransform.anchorY), 0));
            const localTop = contentTransform.convertToNodeSpaceAR(worldTop);
            return contentTransform.height * (1 - contentTransform.anchorY) - localTop.y;
        };

        // 补足末尾空间，让靠后的房间也能对齐视口顶部。
        const extraSpace = Math.max(0,
            getOffset() + this.scrollView.view.height - contentTransform.height);
        layout.paddingBottom = this.originalPaddingBottom + extraSpace;
        layout.updateLayout();

        const offsetY = Math.max(0, Math.min(getOffset(), this.scrollView.getMaxScrollOffset().y));
        this.scrollView.scrollToOffset(new Vec2(0, offsetY), 0.5);
    };


    update(deltaTime: number) {

    }
}


