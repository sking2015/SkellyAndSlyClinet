import { _decorator, Node, Label, Layout, Sprite, Tween, tween, Vec3, EventTouch, Color, ProgressBar, UIOpacity } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CGlobalData } from '../GlobalData';
import { CItem } from '../Item';
import { UIItem } from '../UIItem';
import { FEED_ATTRIBUTES, FeedAttribute } from '../FeedData';
import { CUIProperty } from '../UIProperty';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
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
    private effectLabels: Label[] = [];
    private baseScales = new Map<Node, Vec3>();
    private statViews = new Map<FeedAttribute, CUIProperty>();
    private changeLabels = new Map<FeedAttribute, Label>();
    private changeScales = new Map<Label, Vec3>();
    private mutationLevel: Label = null;
    private mutationProgress: ProgressBar = null;
    private feedButton: Node = null;
    private valueTransition: { progress: number } = null;

    public get selectedItem(): CItem {
        return this.items.find(item => item.id === this.selectedId) || null;
    }

    protected onLoad(): void {
        super.onLoad();
        for (const attribute of FEED_ATTRIBUTES) {
            const node = this.nodeExpandPanel.getChildByPath(`Attribute Backplate/${attribute}`);
            const view = node?.getComponent(CUIProperty);
            if (view) this.statViews.set(attribute, view);
            const label = node?.getChildByPath('TextArea/change')?.getComponent(Label);
            if (label) {
                this.changeLabels.set(attribute, label);
                this.changeScales.set(label, label.node.scale.clone());
                label.node.active = false;
            }
        }
        this.mutationLevel = this.node.getChildByPath('base/roomBG/MutantLvTitle/Lv')?.getComponent(Label);
        this.mutationProgress = this.node.getChildByPath('base/roomBG/MutationProgressBarBg/ProgressBar')?.getComponent(ProgressBar);
        this.feedButton = this.nodeExpandPanel.getChildByName('Feed Button');
        this.feedButton?.on(Node.EventType.TOUCH_END, this.onFeed, this);
        this.refreshFeedData();
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
        const desc = box.getChildByName('ItemDesc');
        this.effectLabels = Array.from({ length: 5 }, (_, index) =>
            desc?.getChildByName(`words${index + 1}`)?.getComponent(Label) || null);
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
        this.refreshFeedData();
        if (!this.slots.length) return;
        this.items = Array.from(CGlobalData.instance.mgrItem.mapItems.values());
        this.firstIndex = Math.max(0, Math.min(this.firstIndex, this.items.length - this.slots.length));
        if (!this.selectedItem) this.selectedId = this.items[0]?.id ?? null;
        this.refreshItems();
    }

    refreshRoomShow() {
        super.refreshRoomShow();
        this.refreshFeedData();
    }

    private refreshFeedData(animate: boolean = false) {
        const data = CGlobalData.instance.dataFeed;
        if (!data.stageCfg) {
            console.warn(`FeedRoom: missing mutation stage config for level ${data.mutLevel}`);
            return;
        }
        // 普通面板刷新不打断进行中的数值动画。
        if (this.valueTransition && !animate) return;
        this.stopValueTransition();
        const starts = new Map<FeedAttribute, { value: number; progress: number }>();
        const targets = new Map<FeedAttribute, { value: number; progress: number }>();
        this.statViews.forEach((view, attribute) => {
            starts.set(attribute, { value: view.curValue, progress: view.pb.progress });
            const value = data[attribute];
            targets.set(attribute, { value, progress: Math.max(0, Math.min(1, value / data.getAttributeCap(attribute))) });
            view.setTitle(`${attribute}:`);
            view.setMaxValue(data.getAttributeCap(attribute));
        });
        if (this.mutationLevel) this.mutationLevel.string = data.mutLevel.toString();
        const mutationStart = this.mutationProgress?.progress || 0;
        const required = data.stageCfg.req_mutation_points;
        const mutationTarget = required > 0 ? Math.max(0, Math.min(1, data.mutPoints / required)) : 0;
        const render = (ratio: number) => {
            this.statViews.forEach((view, attribute) => {
                const start = starts.get(attribute);
                const target = targets.get(attribute);
                view.curValue = start.value + (target.value - start.value) * ratio;
                view.pb.progress = start.progress + (target.progress - start.progress) * ratio;
                view.lblValue.string = Math.round(view.curValue).toString();
            });
            if (this.mutationProgress) this.mutationProgress.progress = mutationStart + (mutationTarget - mutationStart) * ratio;
        };
        if (!animate) {
            render(1);
            return;
        }
        const transition = this.valueTransition = { progress: 0 };
        tween(transition).to(3.4, { progress: 1 }, {
            onUpdate: () => render(transition.progress)
        }).call(() => {
            render(1);
            this.valueTransition = null;
        }).start();
    }

    private stopValueTransition() {
        if (this.valueTransition) Tween.stopAllByTarget(this.valueTransition);
        this.valueTransition = null;
    }

    private onFeed(event: EventTouch) {
        event.propagationStopped = true;
        const item = this.selectedItem;
        if (!item || item.itemNum < 1) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                tips: item ? '道具数量不足' : '请先选择喂养道具'
            }));
            return;
        }
        const changes = CGlobalData.instance.dataFeed.feed(item);
        if (!changes) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: '喂养配置缺失，无法喂养' }));
            return;
        }
        this.refreshItems();
        this.refreshFeedData(true);
        this.showFeedChanges(changes);
    }

    private showFeedChanges(changes: Record<FeedAttribute, number>) {
        this.clearFeedChanges();
        this.changeLabels.forEach((label, attribute) => {
            const change = changes[attribute];
            if (!change) return;
            label.string = `${change > 0 ? '+' : ''}${change}`;
            label.color = change > 0 ? new Color(0, 255, 0, 255) : new Color(255, 0, 0, 255);
            label.node.active = true;
            const opacity = label.getComponent(UIOpacity) || label.addComponent(UIOpacity);
            opacity.opacity = 255;
            const baseScale = this.changeScales.get(label);
            tween(label.node).repeat(3,
                tween<Node>().to(0.5, {
                    scale: new Vec3(baseScale.x * 1.2, baseScale.y * 1.2, baseScale.z)
                }, { easing: 'sineInOut' }).to(0.5, { scale: baseScale.clone() }, { easing: 'sineInOut' })
            ).to(0.4, {
                scale: new Vec3(baseScale.x * 1.5, baseScale.y * 1.5, baseScale.z)
            }, { easing: 'quadOut' }).start();
            tween(opacity).delay(3).to(0.4, { opacity: 0 }).call(() => {
                label.node.active = false;
                label.node.setScale(baseScale);
                opacity.opacity = 255;
            }).start();
        });
    }

    private clearFeedChanges() {
        this.changeLabels.forEach(label => {
            Tween.stopAllByTarget(label.node);
            const baseScale = this.changeScales.get(label);
            if (baseScale) label.node.setScale(baseScale);
            const opacity = label.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 255;
            }
            label.node.active = false;
        });
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
        if (this.itemName) this.itemName.string = this.selectedItem?.feedCfg?.item_name || '';
        this.refreshItemEffects();
    }

    private refreshItemEffects() {
        const config = this.selectedItem?.feedCfg;
        // 按固定属性顺序显示，零值不占用效果标签。
        const attributes = ['hp', 'mp', 'atk', 'def', 'int', 'mdf', 'spd', 'lac'] as const;
        const allPositive = config && attributes.every(attribute => config[`add_${attribute}`] > 0);
        const effects = allPositive ? [{ name: 'ALL', value: 1 }] : config ? attributes
            .map(attribute => ({ name: attribute.toUpperCase(), value: config[`add_${attribute}`] }))
            .filter(effect => effect.value > 0 || effect.value < 0) : [];

        if (effects.length > 5) {
            console.warn(`FeedRoom: item ${this.selectedId} has ${effects.length} attribute effects; only the first 5 are displayed.`);
        }
        this.effectLabels.forEach((label, index) => {
            if (!label) return;
            const effect = effects[index];
            label.node.active = !!effect;
            label.string = effect ? `${effect.value > 0 ? '+' : '-'}${effect.name}` : '';
            if (effect) label.color = effect.value > 0
                ? new Color(0, 255, 0, 255) : new Color(255, 0, 0, 255);
        });
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
        this.stopValueTransition();
        this.clearFeedChanges();
        this.baseScales.forEach((_, node) => this.stopPulse(node));
    }

    CloseExpand() {
        this.stopAnimations();
        this.refreshFeedData();
        super.CloseExpand();
    }

    protected onEnable() {
        this.refreshFeedData();
        if (this.nodeExpandPanel?.activeInHierarchy) this.refreshExpand();
    }

    protected onDisable() {
        this.stopAnimations();
    }

    protected onDestroy() {
        this.stopAnimations();
        this.feedButton?.off(Node.EventType.TOUCH_END, this.onFeed, this);
        this.slots.forEach(slot => slot.node.off(Node.EventType.TOUCH_END, this.onSelectItem, this));
        this.left?.off(Node.EventType.TOUCH_END, this.onMoveLeft, this);
        this.right?.off(Node.EventType.TOUCH_END, this.onMoveRight, this);
    }
}


