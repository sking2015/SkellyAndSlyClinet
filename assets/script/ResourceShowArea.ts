import { _decorator, Component, Label, Node, Sprite, UITransform, math, tween } from 'cc';
import { CGlobalData } from './GlobalData';
import { UniEvent } from './common/CustomEvent';
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

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.on(UniEvent.on_click_gather_res, this.onGatherRes, this);
    }

    stopListnerEvent() {

        this.node.off(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.off(UniEvent.on_click_gather_res, this.onGatherRes, this);
    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }

    start() {
        this.refreshResource();
    }

    onGatherRes(roomType: eRoomType, amount: number, nodeSrc: Node) {

        const worldPos = nodeSrc.getWorldPosition();
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        let targetPos = math.v3(0, 0, 0);

        let nodeRes = new Node();
        let sprRes = nodeRes.addComponent(Sprite);
        switch (roomType) {
            case eRoomType.ertGemMine:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertGemMine);
                targetPos = this.nodeCrystalIcon.getWorldPosition();
                break;
            case eRoomType.ertLumberMill:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertLumberMill);
                targetPos = this.nodeWoodIcon.getWorldPosition();
                break;
            case eRoomType.ertMetalWorkshop:
                sprRes.spriteFrame = CResManager.instance.getRoomResIcon(eRoomType.ertMetalWorkshop);
                targetPos = this.nodeMetalIcon.getWorldPosition();
                break;
        }

        //从世界坐标转换到当前节点的本地坐标系
        targetPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(targetPos);

        console.log("targetPos", targetPos);

        nodeRes.parent = this.node;
        nodeRes.setPosition(localPos);
        nodeRes.setScale(math.v3(0.1, 0.1, 0.1));

        tween(nodeRes).to(0.3, { scale: math.v3(1, 1, 1) }, { easing: 'backOut' })
            .to(0.5, { position: targetPos }, { easing: 'expoOut' })
            .to(0.3, { scale: math.v3(0, 0, 0) }, { easing: 'backIn' }).call(() => {
                switch (roomType) {
                    case eRoomType.ertGemMine:
                        CGlobalData.instance.nGem += amount;
                        break;
                    case eRoomType.ertLumberMill:
                        CGlobalData.instance.nWood += amount;
                        break;
                    case eRoomType.ertMetalWorkshop:
                        CGlobalData.instance.nMetal += amount;
                        break;
                }
                this.refreshResource();
                nodeRes.destroy();
            }).start();

    }

    refreshResource() {
        this.labelCrystal.string = CGlobalData.instance.nGem.toString();
        this.labelFood.string = CGlobalData.instance.nFood.toString();
        this.labelGold.string = CGlobalData.instance.nCoin.toString();
        this.labelMetal.string = CGlobalData.instance.nMetal.toString();
        this.labelSoul.string = CGlobalData.instance.nSoul.toString();
        this.labelWood.string = CGlobalData.instance.nWood.toString();
    }

    update(deltaTime: number) {

    }
}


