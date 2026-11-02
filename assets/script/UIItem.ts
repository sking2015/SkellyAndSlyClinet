import { _decorator, Animation, Component, EventTouch, Node, Sprite, Label, SpriteFrame, Tween, UITransform, Vec3, assetManager, AssetManager, isValid } from 'cc';
import { CItem } from './Item';
import type { CLootDrop, LootResourceType } from './Item';
import { flyResourceToIcon } from './common/common';
import { CGlobalData } from './GlobalData';
import { CustomEvent, UniEvent } from './common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('UIItem')
export class UIItem extends Component {

    @property({ type: Sprite, tooltip: "图标sprite" })
    iconNode: Sprite = null;

    @property({ type: Label, tooltip: "数量标签" })
    numNode: Label = null;

    @property({ tooltip: "掉落飞行时长（秒）", min: 0.1 })
    dropDuration = 0.65;

    @property({ tooltip: "掉落抛物线额外高度", min: 0 })
    dropHeight = 90;

    @property({ tooltip: "收取飞向背包的时长（秒）", min: 0.1 })
    collectDuration = 0.6;

    private iconLoadVersion: number = 0;
    private droppingItem: CLootDrop = null;
    get resourceType(): LootResourceType | null {
        return this.droppingItem && 'resourceType' in this.droppingItem ? this.droppingItem.resourceType : null;
    }
    private dropStart = new Vec3();
    private dropEnd = new Vec3();
    private dropElapsed = 0;
    get lootLandingPosition(): Vec3 | null {
        return this.lootState === 'dropping' || this.lootState === 'ground' ? this.dropEnd : null;
    }
    private lootState: 'none' | 'dropping' | 'ground' | 'flying' = 'none';
    get canQueueCollection(): boolean {
        return !!this.droppingItem && (this.lootState === 'dropping' || this.lootState === 'ground');
    }

    get isLootOnGround(): boolean { return this.lootState === 'ground'; }
    private collectLayer: Node = null;
    private collectTarget: Node = null;
    private collectStartScale = new Vec3();

    private setSceneMode(inScene: boolean) {
        const background = this.node.getChildByName('BG');
        const effect = this.node.getChildByName('looteffect');
        if (background) background.active = !inScene;
        if (effect) {
            effect.active = inScene;
            const animation = effect.getComponent(Animation);
            if (inScene) animation?.play();
            else animation?.stop();
        }
    }

    loadItem(item: CItem) {
        this.node.off(Node.EventType.TOUCH_END, this.onClickLoot, this);
        this.lootState = 'none';
        this.collectLayer = null;
        this.collectTarget = null;
        this.droppingItem = null;
        this.setSceneMode(false);
        const loadVersion = ++this.iconLoadVersion;
        this.iconNode.spriteFrame = null;
        this.iconNode.grayscale = !!item && item.itemNum < 1;
        this.numNode.string = item ? item.itemNum.toString() : '';
        if (!item) return;

        const config = item.feedCfg;
        if (!config || !config.icon_spr) {
            console.error(`Missing icon config for itemId: ${item.id}`);
            return;
        }

        const isCurrentLoad = () => isValid(this, true)
            && isValid(this.iconNode, true) && loadVersion === this.iconLoadVersion;
        const loadIcon = (bundle: AssetManager.Bundle) => {
            if (!isCurrentLoad()) return;

            // 图片的 SpriteFrame 是子资源，路径不包含 .png 扩展名。
            bundle.load(`${config.icon_spr}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (!isCurrentLoad()) return;
                if (err) {
                    console.error(`Failed to load sprite frame for itemId: ${item.id}, error: ${err}`);
                    return;
                }
                this.iconNode.spriteFrame = spriteFrame;
            });
        };

        const bundle = assetManager.getBundle('item');
        if (bundle) {
            loadIcon(bundle);
        } else {
            assetManager.loadBundle('item', (err, loadedBundle) => {
                if (!isCurrentLoad()) return;
                if (err) {
                    console.error('Failed to load item bundle:', err);
                    return;
                }
                loadIcon(loadedBundle);
            });
        }
    }

    // start/end 均使用道具父节点坐标系，落点 Y 为英雄脚下水平线。
    dropItem(item: CLootDrop, start: Vec3, end: Vec3, resourceIcon?: SpriteFrame) {
        this.loadItem('resourceType' in item ? null : item);
        if ('resourceType' in item) {
            this.iconNode.spriteFrame = resourceIcon;
            this.numNode.string = item.amount.toString();
        }
        this.droppingItem = item;
        this.lootState = 'dropping';
        this.dropStart.set(start);
        this.dropEnd.set(end);
        this.dropElapsed = 0;
        this.node.setPosition(start);
        this.setSceneMode(true);
        this.node.on(Node.EventType.TOUCH_END, this.onClickLoot, this);
    }

    private onClickLoot(event: EventTouch) {
        if (this.lootState !== 'ground' && this.lootState !== 'dropping') return;
        event.propagationStopped = true;
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { item: this }));
    }

    collect(layer: Node, target: Node) {
        if (!this.droppingItem || this.lootState === 'flying'
            || !isValid(layer, true) || !isValid(target, true)) return;
        this.collectLayer = layer;
        this.collectTarget = target;
        // 最后一名英雄死亡时可能仍有道具在空中，等它落地再收取。
        if (this.lootState === 'dropping') return;
        this.beginCollect();
    }

    private beginCollect() {
        if (!isValid(this.collectLayer, true) || !isValid(this.collectTarget, true)) return;
        // 脱离房间和 ScrollView 的裁剪、缩放与滚动，保留屏幕上的位置和大小。
        this.node.setParent(this.collectLayer, true);
        this.collectLayer.setSiblingIndex(this.collectLayer.parent.children.length - 1);
        this.node.setSiblingIndex(this.collectLayer.children.length - 1);
        this.dropStart.set(this.node.position);
        this.collectStartScale.set(this.node.scale);
        this.dropElapsed = 0;
        this.lootState = 'flying';
        this.node.off(Node.EventType.TOUCH_END, this.onClickLoot, this);
        if (this.resourceType) {
            flyResourceToIcon(this.node, this.collectTarget,
                () => this.creditLoot(), () => this.removeLoot());
        }
    }

    private creditLoot() {
        const item = this.droppingItem;
        if (!item) return;
        this.droppingItem = null;
        const data = CGlobalData.instance;
        if ('resourceType' in item) {
            switch (item.resourceType) {
                case 'Coin': data.nCoin += item.amount; break;
                case 'Food': data.nFood += item.amount; break;
                case 'Soul': data.nSoul += item.amount; break;
            }
        } else data.mgrItem.addItem(item.id, item.itemNum);
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));
    }

    private removeLoot() {
        this.lootState = 'none';
        this.node.active = false;
        this.node.destroy();
    }

    private finishCollect() {
        this.creditLoot();
        this.removeLoot();
    }

    protected onDestroy() {
        Tween.stopAllByTarget(this.node);
        this.node.off(Node.EventType.TOUCH_END, this.onClickLoot, this);
    }

    update(deltaTime: number) {
        if (!this.droppingItem) return;
        if (this.lootState === 'ground') return;
        this.dropElapsed += deltaTime;
        if (this.lootState === 'flying') {
            if (this.resourceType) return;
            if (!isValid(this.collectTarget, true)) {
                this.finishCollect();
                return;
            }
            const t = Math.min(1, this.dropElapsed / Math.max(0.1, this.collectDuration));
            const ratio = t * t;
            const end = this.collectLayer.getComponent(UITransform).convertToNodeSpaceAR(this.collectTarget.worldPosition);
            this.node.setPosition(
                this.dropStart.x + (end.x - this.dropStart.x) * ratio,
                this.dropStart.y + (end.y - this.dropStart.y) * ratio,
                this.dropStart.z + (end.z - this.dropStart.z) * ratio,
            );
            const scale = 1 - 0.65 * ratio;
            this.node.setScale(this.collectStartScale.x * scale, this.collectStartScale.y * scale, this.collectStartScale.z);
            if (t === 1) this.finishCollect();
            return;
        }
        const t = Math.min(1, this.dropElapsed / Math.max(0.1, this.dropDuration));
        this.node.setPosition(
            this.dropStart.x + (this.dropEnd.x - this.dropStart.x) * t,
            this.dropStart.y + (this.dropEnd.y - this.dropStart.y) * t + 4 * this.dropHeight * t * (1 - t),
            this.dropStart.z + (this.dropEnd.z - this.dropStart.z) * t,
        );
        if (t < 1) return;
        this.lootState = 'ground';
        if (this.collectLayer && this.collectTarget) this.beginCollect();
    }
}


