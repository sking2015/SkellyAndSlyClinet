import { _decorator, Button, Component, instantiate, Label, Layout, Node, Prefab, ScrollView, Sprite, Color, UITransform } from 'cc';
import { CGlobalData } from './GlobalData';
import { CItem } from './Item';
import { UIItem } from './UIItem';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { setNodeVisibleWithFade } from './common/common';

const { ccclass, property } = _decorator;

@ccclass('CItemsPanel')
export class CItemsPanel extends Component {
    @property(Prefab)
    prefabItem: Prefab = null;

    @property(Node)
    itemList: Node = null;

    private get showItem(): UIItem {
        return this.node.getChildByName('ShowItem').getComponent(UIItem);
    }

    @property(Label)
    itemName: Label = null;

    @property(Label)
    itemDesc: Label = null;

    @property(Button)
    closeButton: Button = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    private selectedId: number = null;
    private slots = new Map<number, UIItem>();

    protected onEnable() {
        this.closeButton.node.on(Button.EventType.CLICK, this.OnClickClose, this);
        this.refreshShow();
    }

    protected onDisable() {
        this.closeButton.node.off(Button.EventType.CLICK, this.OnClickClose, this);
    }

    Show(visible: boolean) {
        const wasActive = this.node.active;
        setNodeVisibleWithFade(this.node, visible);
        if (visible && wasActive) this.refreshShow();
    }

    refreshShow() {
        for (const child of [...this.itemList.children]) {
            child.removeFromParent();
            child.destroy();
        }
        this.slots.clear();

        const layout = this.itemList.getComponent(Layout);
        // 按五列计算格子宽度，整格等比缩放，图标、背景和数量一起放大。
        const columns = 5;
        const availableWidth = this.itemList.getComponent(UITransform).width
            - layout.paddingLeft - layout.paddingRight - layout.spacingX * (columns - 1);
        const slotWidth = Math.floor(availableWidth / columns * 100) / 100;
        layout.affectedByScale = true;

        const items = Array.from(CGlobalData.instance.mgrItem.mapItems.values())
            .filter(item => item.itemNum > 0).sort((a, b) => a.id - b.id);
        for (const item of items) {
            const node = instantiate(this.prefabItem);
            const scale = slotWidth / node.getComponent(UITransform).width;
            node.setScale(scale, scale, 1);
            node.parent = this.itemList;
            const slot = node.getComponent(UIItem);
            slot.loadItem(item);
            const button = node.getComponent(Button) || node.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            node.on(Button.EventType.CLICK, () => this.selectItem(item), this);
            this.slots.set(item.id, slot);
        }
        layout.updateLayout();
        this.scrollView?.scrollToTop(0);
        this.selectItem(items.find(item => item.id === this.selectedId) || items[0] || null);
    }

    private selectItem(item: CItem | null) {
        this.selectedId = item?.id ?? null;
        this.showItem.loadItem(item);
        this.showItem.node.active = !!item;
        this.itemName.string = item ? (item.feedCfg?.item_name || String(item.id)) : '';
        this.itemDesc.string = item ? (item.feedCfg?.desc || '') : '暂无道具';
        this.slots.forEach((slot, id) => {
            // Tint the slot background without changing the item's icon.
            const background = slot.node.getChildByName('BG')?.getComponent(Sprite);
            if (background) background.color = id === this.selectedId
                ? new Color(255, 220, 100) : Color.WHITE;
        });
    }

    OnClickClose() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
        this.Show(false);
    }
}
