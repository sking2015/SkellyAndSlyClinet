import { _decorator, Component, Node, Label, ProgressBar, Button, Sprite, SpriteFrame, UITransform,
    Color, BlockInputEvents, Animation, AnimationClip, Canvas, director, isValid } from 'cc';
import { CMajorInvasionManager } from './MajorInvasionManager';
import { invasionState } from './InvasionState';
import { CItem, CItemManager, CLootDrop } from './Item';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import type { LootSettlement } from './Protocol';
const { ccclass, property } = _decorator;

@ccclass('CInvasionHUD')
export class CInvasionHUD extends Component {
    @property(ProgressBar) progress: ProgressBar = null;
    @property(Label) value: Label = null;
    @property(Label) status: Label = null;
    @property(Button) startButton: Button = null;
    @property(SpriteFrame) victory: SpriteFrame = null;
    @property(SpriteFrame) chest: SpriteFrame = null;
    @property(AnimationClip) chestOpen: AnimationClip = null;
    private overlay: Node = null;
    private inputLock: Node = null;
    start() {
        this.startButton.node.on(Button.EventType.CLICK, this.startBattle, this);
        CMajorInvasionManager.instance.onVictory = (dropId, loot) => this.showVictory(dropId, loot);
    }
    private startBattle() { void CMajorInvasionManager.instance.startBattle(); }
    private makeNode(parent: Node, name: string, width: number, height: number, x = 0, y = 0) {
        const node = new Node(name); node.layer = parent.layer; node.parent = parent;
        node.addComponent(UITransform).setContentSize(width, height); node.setPosition(x, y);
        return node;
    }
    private canvas() { return director.getScene()?.getComponentInChildren(Canvas)?.node; }
    update() {
        const manager = CMajorInvasionManager.instance;
        this.progress.progress = invasionState.notoriety / 100;
        this.value.string = `恶名 ${invasionState.notoriety}/100`;
        this.status.string = manager.status;
        this.startButton.node.active = invasionState.phase === 'preparing';
        this.startButton.interactable = manager.ready;
        const root = this.canvas();
        if (!root) return;
        if (invasionState.locked && !this.inputLock) {
            const size = root.getComponent(UITransform).contentSize;
            this.inputLock = this.makeNode(root, 'MajorBattleInputLock', size.width, size.height);
            this.inputLock.addComponent(BlockInputEvents);
            const text = this.makeNode(this.inputLock, 'BattleStatus', 600, 50, 0, size.height / 2 - 125).addComponent(Label);
            text.fontSize = 24; text.color = new Color(255, 218, 140); text.string = '大入侵战斗中，请等待结果';
        } else if (!invasionState.locked && this.inputLock) {
            this.inputLock.destroy(); this.inputLock = null;
        }
    }
    private showVictory(dropId: number, loot?: LootSettlement) {
        const root = this.canvas();
        if (!root || !this.chestOpen || !this.victory || !this.chest) return;
        this.overlay?.destroy();
        const size = root.getComponent(UITransform).contentSize;
        const overlay = this.overlay = this.makeNode(root, 'MajorVictory', size.width, size.height);
        overlay.addComponent(BlockInputEvents);
        const title = this.makeNode(overlay, 'Victory Title', 500, 150, 0, 200).addComponent(Sprite);
        title.sizeMode = Sprite.SizeMode.CUSTOM; title.spriteFrame = this.victory;
        const chestNode = this.makeNode(overlay, 'Chest', 250, 230, 0, -20);
        const sprite = chestNode.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM; sprite.spriteFrame = this.chest;
        const animation = chestNode.addComponent(Animation); animation.addClip(this.chestOpen);
        animation.once(Animation.EventType.FINISHED, () => {
            if (!isValid(overlay, true)) return;
            const drops: CLootDrop[] = loot ? loot.items.map(value => {
                const item = new CItem(); item.id = value.item_id; item.itemNum = value.count; return item;
            }) : CItemManager.getDrops(dropId);
            if (loot) for (const resourceType of ['Coin', 'Food', 'Soul'] as const) {
                const amount = loot.resources[resourceType.toLowerCase()];
                if (amount > 0) drops.push({ resourceType, amount });
            }
            const layer = overlay.getComponent(UITransform);
            overlay.dispatchEvent(new CustomEvent(UniEvent.on_drop_loot, true, {
                drops, room: { nodeCharLayer: overlay, tfBase: layer },
                ground: layer.convertToWorldSpaceAR({ x: 0, y: -180, z: 0 } as any),
                start: chestNode.worldPosition.clone(),
            }));
            this.scheduleOnce(() => {
                if (!isValid(overlay, true)) return;
                overlay.dispatchEvent(new CustomEvent(UniEvent.on_collect_loot, true, { root: overlay }));
            }, 0.6);
            this.scheduleOnce(() => {
                if (!isValid(overlay, true)) return;
                const button = this.makeNode(overlay, 'Close', 320, 65, 0, -300);
                const label = button.addComponent(Label); label.string = '点击继续'; label.fontSize = 30;
                button.addComponent(Button);
                button.on(Button.EventType.CLICK, () => { overlay.destroy(); this.overlay = null; });
            }, Math.max(2, drops.length * 0.12 + 1));
        });
        animation.play(this.chestOpen.name);
    }
    onDestroy() {
        CMajorInvasionManager.instance.onVictory = null;
        this.overlay?.destroy(); this.inputLock?.destroy();
    }
}
