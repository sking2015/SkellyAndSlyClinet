import { _decorator, Component, EditBoxComponent, Node } from 'cc';
import { COverseer } from './overseer';
import { eBattleCamp, eDirction } from '../BaseDef';
import { CCharactersManager } from '../CharacaterMannager';
import { CSkillBase } from '../skills/skillbase';
import { CSkillOne } from '../skills/skillone';
import { CCharacter } from './character';
import { CustomEvent, UniEvent } from '../common/CustomEvent';

const { ccclass, property } = _decorator;


//战斗状态
enum eBattleState {
    ebsNone = 0,
    ebsStand = 1,   //普通站立
    ebsRun = 2,     //奔跑
    ebsSkill = 3,   //使用技能
    ebsDead = 4,    //已经死亡
}

@ccclass('CBattleRole')
export class CBattleRole extends COverseer {
    //是否在战斗状态，对于魔王军来说，有可能是在房间巡逻或监工
    bInBattle: boolean = false;

    //当前目标
    nTarget: number = -1;

    charTar: CCharacter = null;

    skills: CSkillBase[] = [];

    //当前技能，先选取CD为零，然后是否有合法目标
    curSkill: CSkillBase = null;

    eState: eBattleState = eBattleState.ebsNone;

    //受击时的行为者，简单的说就是这次被谁打的
    hitedcaster: CCharacter = null;

    start() {
        this.skills.push(new CSkillBase);
    }

    searchTarget() {

    }

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_ani_key, this.onAniKeyFrame, this);
    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_ani_key, this.onAniKeyFrame, this);
    }

    onAniKeyFrame(event: CustomEvent) {
        console.log("关键帧事件触发:", event.detail)
        this.charTar.onHited();
    }

    onHitedReady(caster: CCharacter) {
        this.hitedcaster = caster;
    }

    //受击表现，可能在两个时机播放，一时如果配置了关键帧，那么在关键就会执行这个函数。
    //如果攻击动作没配置关键帧，将在攻击动画完毕后调用这个函数
    onHited() {
        if (this.hitedcaster) {
            this.playHited();
            this.hitedcaster = null;
        }

    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }


    //选择一个技能
    onSelectSkill() {
        if (!this.curSkill || this.curSkill.GetCD() > 0) {
            for (let i = 0; i < this.skills.length; ++i) {
                const skill = this.skills[i];
                if (skill.GetCD() == 0) {
                    this.curSkill = skill;
                }
            }
        }
    }

    //选择一个目标
    onSelectTarget() {
        //如果有技能，并且没有目标或目标已失效。要重新选择目标
        if (this.curSkill && !this.curSkill.hasTarget() || !this.curSkill.IsValidTarget()) {
            this.curSkill.OnSelectTarget();
            this.charTar = this.curSkill.target;
            // this.charTar = this.curSkill.SearchNearestTarget();
        }
    }

    //战斗AI
    BattleAITick() {
        //选择技能
        this.onSelectSkill();

        //选择技能
        this.onSelectTarget();

        if (this.curSkill) {
            this.curSkill.OnCheckTargetDistance();

            //距离之内，向目标移动
            if (this.curSkill.IsCanCastByDistance()) {
                this.eState = eBattleState.ebsSkill;
                this.curSkill.doCast(() => {
                    this.playStand();
                });
            } else {
                //如果是距离不够，要向目标移动                
                this.eState = eBattleState.ebsRun;
                this.onRunToTarget();
                this.playRun();
            }
        }
    }

    onRunToTarget() {
        if (this.charTar) {
            if (this.charTar.getPosition() > this.getPosition()) {
                this.moveDirection = eDirction.edRight;
            } else {
                this.moveDirection = eDirction.edLeft;
            }

            this.eState = eBattleState.ebsRun;
        }
    }

    handleMove(dt: number) {
        if (this.eState == eBattleState.ebsRun) {
            let pos = this.node.position.clone();
            let speed = this.runSpeed;

            pos.x += speed * this.moveDirection * dt;
        }
    }

    AITick() {
        if (this.bInBattle) {
            this.BattleAITick();
        } else {
            super.AITick();
        }
    }

    update(dt: number) {
        this.handleMove(dt);
    }
}


