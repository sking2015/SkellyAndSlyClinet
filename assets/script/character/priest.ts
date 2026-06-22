import { _decorator, Component, Node, Prefab, UITransform, Animation } from 'cc';
import { CBattleRole } from './battlerole';
import { CCharacter } from './character';
const { ccclass, property } = _decorator;

//弓手主要是要带一个准星，需要准星的远程类角色使用此类

@ccclass('CPriest')
export class CPriest extends CBattleRole {
    @property({ type: Node, tooltip: "施法粒子特效" })
    nodeActionEffect: Node = null;

    @property({ type: Node, tooltip: "目标恢复特效节点,施法时将该节点扔目标人物节点上" })
    nodeCureEffect: Node = null;

    onBeforeCastSkill() {
        this.nodeActionEffect.active = true;
        this.playCastEffect();
    }

    onAfterCastSkill() {
        this.nodeActionEffect.active = false;
    }

    onCastSkillToTarget(char: CCharacter) {
        console.log("治疗目标...");
        this.nodeCureEffect.parent = char.node;
        this.nodeCureEffect.x = 0;
        this.nodeCureEffect.y = 0;

        this.nodeCureEffect.active = true;
        const ani = this.nodeCureEffect.getComponent(Animation);
        ani.play(ani.clips[0].name);
        ani.once(Animation.EventType.FINISHED, () => {
            this.nodeCureEffect.parent = this.node;
        })
    }

    start() {
        super.start();

        this.nodeActionEffect.active = false;
        this.nodeCureEffect.active = false;

    }




}


