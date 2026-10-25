import { _decorator, Node, Label, Layout, Sprite, Tween, tween, Vec3, EventTouch, Color, ProgressBar, UIOpacity, Prefab, instantiate, isValid, assetManager, AssetManager, Animation, AnimationClip } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CGlobalData } from '../GlobalData';
import { CItem } from '../Item';
import { UIItem } from '../UIItem';
import { CFeedData, FEED_ATTRIBUTES, FeedAttribute } from '../FeedData';
import { CUIProperty } from '../UIProperty';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { MutStageCfgData } from '../config/MutStageCfg';
import { MonstersData } from '../config/Monsters';
import { CCharacter } from '../character/character';
import { eCharPlace } from '../BaseDef';
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
    private mutationPercent: Label = null;
    private feedButton: Node = null;
    private valueTransition: { progress: number } = null;
    private displayedMutLevel: number = null;
    private pendingCapResets = new Map<CUIProperty, { cap: number; opacity: UIOpacity; originalOpacity: number }>();
    private roleBase: Node = null;
    private character: CCharacter = null;
    private characterAnimation: Animation = null;
    private idleCountdown = 0;
    private shownModel: number = null;
    private modelPrefabs = new Map<number, Prefab>();
    private modelLoads = new Map<number, Promise<Prefab>>();
    private feeding = false;
    private feedVersion = 0;
    private mutationTransition: { progress: number } = null;

    public get selectedItem(): CItem {
        return this.items.find(item => item.id === this.selectedId) || null;
    }

    protected onLoad(): void {
        super.onLoad();
        this.roleBase = this.node.getChildByPath('base/roomBG/RoleBase');
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
        this.mutationPercent = this.node.getChildByPath('base/roomBG/MutantEnergyTitle/value')?.getComponent(Label);
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
        if ((this.valueTransition || this.feeding) && !animate) return;
        this.refreshCharacter();
        this.stopValueTransition();
        if (!animate) this.clearCapResets();
        const starts = new Map<FeedAttribute, number>();
        const targets = new Map<FeedAttribute, number>();
        this.statViews.forEach((view, attribute) => {
            starts.set(attribute, view.curValue);
            targets.set(attribute, data[attribute]);
            view.setTitle(`${attribute}:`);
        });
        const mutationTargetLevel = data.mutLevel;
        const required = data.stageCfg.req_mutation_points;
        const mutationTarget = required > 0 ? Math.max(0, Math.min(1, data.mutPoints / required)) : 0;
        const render = (ratio: number) => {
            this.displayedMutLevel = mutationTargetLevel;
            // 跨级时保持原条长闪烁，结束后再按新上限直接重置。
            const stage = data.stageCfg;
            this.statViews.forEach((view, attribute) => {
                const startValue = starts.get(attribute);
                view.curValue = startValue + (targets.get(attribute) - startValue) * ratio;
                const cap = attribute === 'HP' ? stage.hp_cap
                    : attribute === 'MP' ? stage.mp_cap : stage.stat_cap;
                const pending = this.pendingCapResets.get(view);
                if (pending) {
                    pending.cap = cap;
                } else if (animate && cap !== view.maxValue) {
                    this.blinkBeforeCapReset(view, cap);
                } else {
                    view.setMaxValue(cap);
                    view.pb.progress = Math.max(0, Math.min(1, view.curValue / cap));
                }
                view.lblValue.string = Math.round(view.curValue).toString();
            });
            if (this.mutationLevel) this.mutationLevel.string = this.displayedMutLevel.toString();
            // 突变槽由独立的逐阶段动画驱动，属性插值不回写槽进度。
            if (!this.feeding) this.setMutationProgress(mutationTarget);
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

    private blinkBeforeCapReset(view: CUIProperty, cap: number) {
        const node = view.pb.node;
        const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        const pending = { cap, opacity, originalOpacity: opacity.opacity };
        this.pendingCapResets.set(view, pending);
        tween(opacity).repeat(5,
            tween<UIOpacity>().to(0.15, { opacity: 0 })
                .to(0.15, { opacity: pending.originalOpacity })
        ).call(() => {
            view.setMaxValue(pending.cap);
            view.pb.progress = Math.max(0, Math.min(1, view.curValue / pending.cap));
            opacity.opacity = pending.originalOpacity;
            this.pendingCapResets.delete(view);
        }).start();
    }

    private clearCapResets() {
        this.pendingCapResets.forEach(pending => {
            Tween.stopAllByTarget(pending.opacity);
            pending.opacity.opacity = pending.originalOpacity;
        });
        this.pendingCapResets.clear();
    }

    private setMutationProgress(progress: number) {
        if (this.mutationProgress) this.mutationProgress.progress = progress;
        if (this.mutationPercent) this.mutationPercent.string = `${Math.floor(progress * 100)}%`;
    }

    private async loadModel(id: number): Promise<Prefab> {
        if (this.modelPrefabs.has(id)) return this.modelPrefabs.get(id);
        if (this.modelLoads.has(id)) return this.modelLoads.get(id);
        const loading = new Promise<Prefab>((resolve, reject) => {
            const path = MonstersData[id]?.Prefab;
            if (!path) {
                reject(new Error(`Missing monster prefab config: ${id}`));
                return;
            }
            const load = (bundle: AssetManager.Bundle) => {
                bundle.load(path, Prefab, (error, prefab) => error ? reject(error) : resolve(prefab));
            };
            const bundle = assetManager.getBundle('monsters');
            if (bundle) load(bundle);
            else assetManager.loadBundle('monsters', (error, loaded) => error ? reject(error) : load(loaded));
        });
        this.modelLoads.set(id, loading);
        try {
            const prefab = await loading;
            this.modelPrefabs.set(id, prefab);
            return prefab;
        } finally {
            this.modelLoads.delete(id);
        }
    }

    private refreshCharacter() {
        if (!this.roleBase) return;
        const id = CGlobalData.instance.dataFeed.model_id;
        if (this.shownModel === id) return;
        const prefab = this.modelPrefabs.get(id);
        if (prefab) {
            this.showCharacter(id, prefab);
        } else {
            this.loadModel(id).then(loaded => {
                if (isValid(this, true) && CGlobalData.instance.dataFeed.model_id === id) {
                    this.showCharacter(id, loaded);
                }
            }).catch(error => console.error('FeedRoom: failed to load character', error));
        }
    }

    private showCharacter(id: number, prefab: Prefab) {
        if (this.shownModel === id) return;
        const node = instantiate(prefab);
        const character = node.getComponent(CCharacter);
        character.eCharId = id;
        character.SetPlace(eCharPlace.ecpShow);
        // 在挂到活动节点前设置展示状态，防止参与房间战斗和移动。
        for (const child of [...this.roleBase.children]) {
            child.removeFromParent();
            child.destroy();
        }
        node.setPosition(0, 0, 0);
        node.parent = this.roleBase;
        // 喂养展示由房间控制动作，停用角色自身的巡逻/战斗 AI。
        character.enabled = false;
        this.character = character;
        this.characterAnimation = node.getChildByName('char')?.getComponent(Animation) || null;
        const stand = this.characterAnimation?.getState('stand');
        if (stand) {
            stand.wrapMode = AnimationClip.WrapMode.Loop;
            this.characterAnimation.play('stand');
        }
        this.idleCountdown = 8 + Math.random() * 6;
        this.shownModel = id;
    }

    update(deltaTime: number) {
        const animation = this.characterAnimation;
        const idle = animation?.getState('idle');
        if (!idle || !animation.getState('stand')) return;
        if (idle.isPlaying) return;
        this.idleCountdown -= deltaTime;
        if (this.idleCountdown > 0) return;
        this.idleCountdown = 8 + Math.random() * 6;
        idle.wrapMode = AnimationClip.WrapMode.Normal;
        this.character.play('idle'); // 播放一次后由 CCharacter 返回 stand。
    }

    private animateMutationProgress(target: number, complete: () => void) {
        const transition = this.mutationTransition = { progress: this.mutationProgress?.progress || 0 };
        tween(transition).to(3.4, { progress: target }, {
            onUpdate: () => this.setMutationProgress(transition.progress)
        }).delay(target === 1 ? 0.15 : 0).call(() => {
            this.setMutationProgress(target);
            this.mutationTransition = null;
            complete();
        }).start();
    }

    private advanceMutation() {
        const data = CGlobalData.instance.dataFeed;
        if (!data.canMutate) {
            const required = data.stageCfg.req_mutation_points;
            this.animateMutationProgress(required > 0 ? Math.min(1, data.mutPoints / required) : 0, () => {
                this.feeding = false;
                this.refreshFeedData();
            });
            return;
        }
        this.animateMutationProgress(1, () => {
            const changes = data.mutate();
            if (!changes) {
                this.feeding = false;
                console.error('FeedRoom: missing mutation config');
                return;
            }
            // 所有模型已经在扣除道具前预加载，满槽这一刻即可同步切换。
            this.refreshFeedData(true);
            this.character?.playEffect();
            this.playUpgradeEffect(false);
            this.showFeedChanges(changes);
            this.setMutationProgress(0);
            this.advanceMutation();
        });
    }

    private async onFeed(event: EventTouch) {
        event.propagationStopped = true;
        const item = this.selectedItem;
        if (!item || item.itemNum < 1) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                tips: item ? '道具数量不足' : '请先选择喂养道具'
            }));
            return;
        }
        if (this.feeding) return;
        const data = CGlobalData.instance.dataFeed;
        // 先验证本次可能跨越的所有阶段并加载形像，失败时不消耗道具。
        const preview = Object.assign(new CFeedData(), data);
        const config = item.feedCfg;
        if (!config) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: '喂养配置缺失，无法喂养' }));
            return;
        }
        preview.nBeastPoint += config.gene_beast;
        preview.nAbyssPoint += config.gene_abyss;
        preview.nLegionPoint += config.gene_legion;
        preview.nFleshPoint += config.gene_flesh;
        preview.mutPoints += config.mut_points;
        this.feeding = true;
        const version = ++this.feedVersion;
        try {
            const models = new Set<number>([data.model_id]);
            while (preview.canMutate) {
                if (!preview.mutate()) throw new Error('缺少突变阶段、奖励或角色配置');
                models.add(preview.model_id);
            }
            await Promise.all([...models].map(id => this.loadModel(id)));
        } catch (error) {
            if (version !== this.feedVersion || !isValid(this, true)) return;
            this.feeding = false;
            console.error('FeedRoom: mutation preparation failed', error);
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: '角色资源或突变配置加载失败，请重试' }));
            return;
        }
        if (version !== this.feedVersion || !isValid(this, true)) return;
        const changes = data.feed(item);
        if (!changes) {
            this.feeding = false;
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: '喂养配置缺失，无法喂养' }));
            return;
        }
        this.refreshItems();
        this.refreshFeedData(true);
        this.showFeedChanges(changes);
        this.advanceMutation();
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
        const attributes = ['hp', 'mp', 'atk', 'def', 'int', 'mdf', 'spd', 'lca'] as const;
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
        this.clearCapResets();
        this.clearFeedChanges();
        this.baseScales.forEach((_, node) => this.stopPulse(node));
    }

    CloseExpand() {
        // 折叠面板不取消已经消耗道具的喂养和突变流程。
        this.clearFeedChanges();
        this.baseScales.forEach((_, node) => this.stopPulse(node));
        if (!this.feeding) this.refreshFeedData();
        super.CloseExpand();
    }

    protected onEnable() {
        this.refreshFeedData();
        if (this.nodeExpandPanel?.activeInHierarchy) this.refreshExpand();
    }

    protected onDisable() {
        this.finishPendingMutations();
        this.stopAnimations();
    }

    private finishPendingMutations() {
        ++this.feedVersion;
        if (this.mutationTransition) Tween.stopAllByTarget(this.mutationTransition);
        this.mutationTransition = null;
        // 离开场景时保留已支付道具的全部结果，下次进入从 dataFeed 恢复。
        const data = CGlobalData.instance.dataFeed;
        while (data.canMutate && data.mutate()) { /* 每阶段只结算一次 */ }
        this.feeding = false;
    }

    protected onDestroy() {
        this.finishPendingMutations();
        this.stopAnimations();
        this.feedButton?.off(Node.EventType.TOUCH_END, this.onFeed, this);
        this.slots.forEach(slot => slot.node.off(Node.EventType.TOUCH_END, this.onSelectItem, this));
        this.left?.off(Node.EventType.TOUCH_END, this.onMoveLeft, this);
        this.right?.off(Node.EventType.TOUCH_END, this.onMoveRight, this);
    }
}


