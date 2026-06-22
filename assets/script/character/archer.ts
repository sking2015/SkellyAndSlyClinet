import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { CBattleRole } from './battlerole';
const { ccclass, property } = _decorator;

//弓手主要是要带一个准星，需要准星的远程类角色使用此类

@ccclass('CArcher')
export class CArcher extends CBattleRole {
    @property({ type: Node, tooltip: "准星" })
    nodeAim: Node = null;

    start() {
        super.start();

        this.nodeAim.active = false;
    }

    playCastEffect() {
        if (this.nodeAim) {
            this.nodeAim.active = true;

            this.nodeAim.parent = this.charTar.node;

            this.nodeAim.x = 0;
            this.nodeAim.y = this.charTar.getComponent(UITransform).height * 0.5;


            // const worldPos = this.charTar.getCenterPosByWorld();

            // let localPos = new Vec3();

            // this.node.inverseTransformPoint(localPos, worldPos);

            // this.nodeAim.setPosition(localPos);
        }
    }

    onMissileFinished() {
        this.nodeAim.active = false;
        this.nodeAim.parent = this.node;
    }


}


