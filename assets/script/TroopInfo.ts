import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CTroopInfo')
export class CTroopInfo extends Component {

    @property({ type: Sprite, tooltip: "守卫头像" })
    sprHead: Sprite = null;

    @property({ type: Sprite, tooltip: "守卫类型标志" })
    sprIcon: Sprite = null;

    @property({ type: Label, tooltip: "守卫数量" })
    lblCount: Label = null;

    @property({ type: Label, tooltip: "总血量" })
    lblHealth: Label = null;

    start() {

    }

    setHeadSprite(sprite: Sprite) {
        this.sprHead.spriteFrame = sprite.spriteFrame;
    }

    setCount(count: number) {
        this.lblCount.string = "x" + count.toString();
    }

    setHealth(health: number) {
        if (health > 0) {
            this.lblHealth.string = health.toString();
        } else {
            this.lblHealth.string = "";
        }
    }

    update(deltaTime: number) {

    }
}


