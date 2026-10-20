import { _decorator, Node, Label, Layout, Sprite, Tween, tween, Vec3, EventTouch } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CGlobalData } from '../GlobalData';
import { CItem } from '../Item';
import { UIItem } from '../UIItem';
const { ccclass } = _decorator;

@ccclass('CFeedRoom')
export class CFeedRoom extends CBaseRoom {
    private slots: UIItem[] = [];
    private items: CItem[] = [];
    private firstIndex = 0;
    private selectedId: number = null;
    private border: Node = null;
    private left: Node = null;
    private right: Node = null;
    private itemName: Label = null;
    private baseScales = new Map<Node, Vec3>();

    public get selectedItem(): CItem {
        return this.items.find(item => item.id === this.selectedId) || null;
    }

    protected onLoad(): void {
        super.onLoad();
        const box = this.findSelectionBox(this.nodeExpandPanel);
        const list = box?.getChildByName('ItemList') || box?.getChildByName('itemList');
        if (!list) {
            console.error('FeedRoom: missing item list');
            return;
        }
        // 保留槽位的位置，防止选中框参与 Layout 排列。
        const layout = list.getComponent(Layout);
        if (layout) layout.enabled = false;
        this.slots = list.children.map(node => node.getComponent(UIItem)).filter(Boolean);
        this.border = list.getChildByName('SelectionBorder') || list.getChildByName('Selection Border');
        this.left = list.getChildByName('left_Arrow');
        this.right = list.getChildByName('right_Arrow');
        this.itemName = box.getChildByName('ItemName')?.getComponent(Label);
        if (this.border) {
            this.border.setSiblingIndex(list.children.length - 1);
            this.border.active = false;
        }
        for (const node of [this.border, this.left, this.right]) {
            if (node) this.baseScales.set(node, node.scale.clone());
        }
        this.slots.forEach(slot => slot.node.on(Node.EventType.TOUCH_END, this.onSelectItem, this));
        this.left?.on(Node.EventType.TOUCH_END, this.onMoveLeft, this);
        this.right?.on(Node.EventType.TOUCH_END, this.onMoveRight, this);
    }

    private findSelectionBox(node: Node): Node {
        if (node.name === 'Feed_Item_Selection_Box') return node;
        for (const child of node.children) {
            const result = this.findSelectionBox(child);
            if (result) return result;
        }
        return null;
    }

    refreshExpand() {
        if (!this.slots.length) return;
        this.items = Array.from(CGlobalData.instance.mgrItem.mapItems.values());
        this.firstIndex = Math.max(0, Math.min(this.firstIndex, this.items.length - this.slots.length));
        if (!this.selectedItem) this.selectedId = this.items[0]?.id ?? null;
        this.refreshItems();
    }

    private refreshItems() {
        // 空槽保留位置，清空图标和数量。
        this.slots.forEach((slot, index) => slot.loadItem(this.items[this.firstIndex + index] || null));
        this.refreshSelection();
        this.refreshArrow(this.left, this.firstIndex > 0);
        this.refreshArrow(this.right, this.firstIndex + this.slots.length < this.items.length);
    }

    private onSelectItem(event: EventTouch) {
        event.propagationStopped = true;
        const index = this.slots.findIndex(slot => slot.node === event.currentTarget);
        const item = this.items[this.firstIndex + index];
        if (index < 0 || !item) return;
        this.selectedId = item.id;
        this.refreshSelection();
    }

    private refreshSelection() {
        const index = this.items.findIndex(item => item.id === this.selectedId) - this.firstIndex;
        if (this.border) {
            this.stopPulse(this.border);
            const visible = index >= 0 && index < this.slots.length;
            this.border.active = visible;
            if (visible) {
                this.border.setPosition(this.slots[index].node.position);
                if (this.nodeExpandPanel.activeInHierarchy) this.startPulse(this.border);
            }
        }
        if (this.itemName) this.itemName.string = this.selectedItem?.config?.item_name || '';
    }

    private onMoveLeft(event: EventTouch) {
        event.propagationStopped = true;
        this.moveItems(-1);
    }

    private onMoveRight(event: EventTouch) {
        event.propagationStopped = true;
        this.moveItems(1);
    }

    private moveItems(direction: number) {
        const next = this.firstIndex + direction;
        if (next < 0 || next > Math.max(0, this.items.length - this.slots.length)) return;
        this.firstIndex = next;
        // 选中项移出窗口时，选择距离它最近的可见道具。
        const selectedIndex = this.items.findIndex(item => item.id === this.selectedId);
        const visibleIndex = Math.max(next, Math.min(selectedIndex, next + this.slots.length - 1));
        this.selectedId = this.items[visibleIndex]?.id ?? null;
        this.refreshItems();
    }

    private refreshArrow(node: Node, enabled: boolean) {
        if (!node) return;
        this.stopPulse(node);
        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.grayscale = !enabled;
        if (enabled && this.nodeExpandPanel.activeInHierarchy) this.startPulse(node);
    }

    private startPulse(node: Node) {
        const base = this.baseScales.get(node);
        if (!base) return;
        // 按原始缩放计算，保留左箭头的负 X 翻转。
        tween(node).repeatForever(
            tween<Node>().to(0.55, { scale: new Vec3(base.x * 1.08, base.y * 1.08, base.z) }, { easing: 'sineInOut' })
                .to(0.55, { scale: base.clone() }, { easing: 'sineInOut' })
        ).start();
    }

    private stopPulse(node: Node) {
        Tween.stopAllByTarget(node);
        const base = this.baseScales.get(node);
        if (base) node.setScale(base);
    }

    private stopAnimations() {
        this.baseScales.forEach((_, node) => this.stopPulse(node));
    }

    CloseExpand() {
        this.stopAnimations();
        super.CloseExpand();
    }

    protected onEnable() {
        if (this.nodeExpandPanel?.activeInHierarchy) this.refreshExpand();
    }

    protected onDisable() {
        this.stopAnimations();
    }

    protected onDestroy() {
        this.stopAnimations();
        this.slots.forEach(slot => slot.node.off(Node.EventType.TOUCH_END, this.onSelectItem, this));
        this.left?.off(Node.EventType.TOUCH_END, this.onMoveLeft, this);
        this.right?.off(Node.EventType.TOUCH_END, this.onMoveRight, this);
    }
}


