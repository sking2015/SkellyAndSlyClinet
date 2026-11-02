import { _decorator, Component, Label, Node, Sprite, UITransform } from 'cc';
import { flyResourceToIcon, formatCompactNumber } from './common/common';
import type { LootResourceType } from './Item';
import { CGlobalData } from './GlobalData';
import { CResManager } from './ResManager';
import { eRoomType } from './BaseDef';

const { ccclass, property } = _decorator;

@ccclass('ResourceShowArea')
export class ResourceShowArea extends Component {

    @property({ type: Label, tooltip: "金属资源显示文本" })
    labelMetal: Label = null;
    @property({ type: Node, tooltip: "金属资源图标节点" })
    nodeMetalIcon: Node = null;

    @property({ type: Label, tooltip: "木材资源显示文本" })
    labelWood: Label = null;
    @property({ type: Node, tooltip: "木材资源图标节点" })
    nodeWoodIcon: Node = null;

    @property({ type: Label, tooltip: "水晶资源显示文本" })
    labelCrystal: Label = null;
    @property({ type: Node, tooltip: "水晶资源图标节点" })
    nodeCrystalIcon: Node = null;

    @property({ type: Label, tooltip: "食物资源显示文本" })
    labelFood: Label = null;

    @property({ type: Label, tooltip: "灵魂碎片资源显示文本" })
    labelSoul: Label = null;

    @property({ type: Label, tooltip: "金币资源显示文本" })
    labelGold: Label = null;

    @property(Node)
    nodeCoinIcon: Node = null;
    @property(Node)
    nodeFoodIcon: Node = null;
    @property(Node)
    nodeSoulIcon: Node = null;

    getLootResourceIcon(type: LootResourceType): Node {
        return type === 'Coin' ? this.nodeCoinIcon : type === 'Food' ? this.nodeFoodIcon : this.nodeSoulIcon;
    }

    start() {
        this.refreshResource();
    }

    onGatherRes(roomType: eRoomType, amount: number, nodeSrc: Node) {

        const worldPos = nodeSrc.getWorldPosition();
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        let target: Node;

        let nodeRes = new Node();
        let sprRes = nodeRes.addComponent(Sprite);
        switch (roomType) {
            case eRoomType.ertCrystalMine:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertCrystalMine);
                target = this.nodeCrystalIcon;
                break;
            case eRoomType.ertLumberMill:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertLumberMill);
                target = this.nodeWoodIcon;
                break;
            case eRoomType.ertMetalWorkshop:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertMetalWorkshop);
                target = this.nodeMetalIcon;
                break;
        }

        if (!target) { nodeRes.destroy(); return; }
        nodeRes.layer = this.node.layer;
        nodeRes.parent = this.node;
        nodeRes.setPosition(localPos);
        flyResourceToIcon(nodeRes, target, () => {
            switch (roomType) {
                case eRoomType.ertCrystalMine:
                    CGlobalData.instance.nCrystal += amount;
                    break;
                case eRoomType.ertLumberMill:
                    CGlobalData.instance.nWood += amount;
                    break;
                case eRoomType.ertMetalWorkshop:
                    CGlobalData.instance.nMetal += amount;
                    break;
            }
            this.refreshResource();
        }, () => nodeRes.destroy());

    }

    refreshResource() {
        console.log("refreshResource~!!")
        this.labelCrystal.string = formatCompactNumber(CGlobalData.instance.nCrystal);
        this.labelFood.string = formatCompactNumber(CGlobalData.instance.nFood);
        this.labelGold.string = formatCompactNumber(CGlobalData.instance.nCoin);
        this.labelMetal.string = formatCompactNumber(CGlobalData.instance.nMetal);
        this.labelSoul.string = formatCompactNumber(CGlobalData.instance.nSoul);
        this.labelWood.string = formatCompactNumber(CGlobalData.instance.nWood);
    }

    update(deltaTime: number) {

    }
}


