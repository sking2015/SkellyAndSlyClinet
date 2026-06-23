import { _decorator, Vec3, Enum, Component, Animation, Node, Color, bits, UITransform, Sprite, Prefab, instantiate, tween } from 'cc';
import { COverseer } from './overseer';
import { eBattleCamp, eCCharacterID, eDirction, eMissileId } from '../BaseDef';
import { CCharactersManager } from '../CharacaterMannager';
import { CSkillBase } from '../skills/skillbase';
import { CSkillOnce } from '../skills/skillonce';
import { CSkillLanche } from '../skills/skillLanche';
import { CSkillCure } from '../skills/skillcure';
import { fadeInOut, waitFadeInout } from '../common/common';
import { CSkillRepeatedly } from '../skills/skillRepeatedly';
import { CSkillRepeatRange } from '../skills/skillRepeatRange';
import { CCharacter } from './character';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { CResManager } from '../ResManager';
import { CMissile } from '../skills/missile';
import { CPopInfo } from '../PopInfo';
import { CStatuBar } from '../StatuBar';



//战斗状态
enum eBattleState {
    ebsNone = 0,
    ebsStand = 1,   //普通站立
    ebsRun = 2,     //奔跑
    ebsSkill = 3,   //使用技能    
    ebsHited = 4,   //受击硬直中
    ebsDead = 5,    //已经死亡
}

enum eFlyState {
    efsNone = 0,
    efsFly = 1,
    efsFlyEnd = 2,
}

enum eKeyFrameEvent {
    ekeHited = "hit",       //击打关键帧,需要直接调用被攻击目标onhited
    ekeLaunche = "launche", //发射关键帧，需要调用自己的launchemissile
}

const { ccclass, property } = _decorator;

@ccclass('CBattleRole')
export class CBattleRole extends COverseer {

    @property({ type: Node, tooltip: "技能附加效果" })
    nodeSkillCast: Node = null;

    @property({ type: Animation, tooltip: "技能附加效果动画" })
    aniSkillCast: Animation = null;

    @property({ type: Animation, tooltip: "大招闪光" })
    aniFlash: Animation = null

    //是否在战斗状态，对于魔王军来说，有可能是在房间巡逻或监工
    bInBattle: boolean = false;

    //当前目标
    nTarget: number = -1;

    charTar: CCharacter = null;

    //多个目标放在这里
    arrTargets: CCharacter[] = [];

    skills: CSkillBase[] = [];

    //当前技能，先选取CD为零，然后是否有合法目标
    curSkill: CSkillBase = null;

    eState: eBattleState = eBattleState.ebsNone;

    //受击时的行为者，简单的说就是这次被谁打的
    hitedcaster: CCharacter = null;

    //是否正在受击
    bHited: boolean = false;

    //是否正在放技能
    bCasting: boolean = false;

    bUninterruptible: boolean = false;

    //飞行状态
    eFlystate: eFlyState = eFlyState.efsNone;

    //跳跃状态
    bJumpstate: boolean = false;


    //发射子弹节点
    nodeLaunchePos: Node = null;

    //吟唱特效节点
    nodeCastEffect: Node = null;

    comStatuBar: CStatuBar = null;

    start() {


        this.nHalfWidth = this.node.getComponent(UITransform).width / 2;

        this.nodeLaunchePos = this.node.getChildByName('lanchepos');

        this.nodeCastEffect = this.node.getChildByName("cast_effect");

        if (this.nodeSkillCast) {
            this.nodeSkillCast.active = false;
        }
    }

    _HP: number = 0;
    _MaxHP: number = 0;

    getHP(): number {
        return this._HP;
    }

    setHP(hp: number) {
        this._HP = hp;
        if (this.comStatuBar) {
            this.comStatuBar.setHP(this._HP);
        }
    }

    setMaxHP(max: number) {
        console.log("设置最大HP");
        this._MaxHP = max;
        if (this.comStatuBar) {
            console.log("究竟哪有问题~！");
            this.comStatuBar.setMaxHP(this._MaxHP);
            this.comStatuBar.setHP(this._HP);
        }
    }

    getHPPer(): number {
        return this._HP / this._MaxHP;
    }

    _MP: number = 0;
    _MaxMP: number = 0;

    getMP(): number {
        return this._MP;
    }

    setMP(mp: number) {
        this._MP = mp;
        if (this.comStatuBar) {
            this.comStatuBar.setMP(this._MP);
        }
    }

    setMaxMP(max: number) {
        this._MaxMP = max;
        if (this.comStatuBar) {
            this.comStatuBar.setMaxMP(this._MaxMP);
            this.comStatuBar.setMP(this._MP);
        }
    }

    getMPPer(): number {
        return this._MP / this._MaxMP;
    }

    init() {
        const nodeStatuBar = this.node.getChildByName("statuBar");
        if (nodeStatuBar) {

            this.comStatuBar = nodeStatuBar.getComponent(CStatuBar);
            console.log("有statuBar条吗", this.comStatuBar);
        }
    }

    loadData() {
        if (this.getBattleCamp() == eBattleCamp.ebcHero) {
            const skill = new CSkillOnce(this);
            skill.LoadData();
            this.skills.push(skill);

            this.setMaxHP(20000);
            this.setHP(20000);
            this.setMaxMP(1000);
            this.setMP(1000);
        }

        if (this.eCharId == eCCharacterID.eciMageHF) {
            const skill = new CSkillLanche(this);
            skill.LoadData();
            skill.eMissile = eMissileId.emiFireball;
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciArcherEM) {
            const skill = new CSkillLanche(this);
            skill.LoadData();
            skill.eMissile = eMissileId.emiArrow;
            skill.nCD = 2000;
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciPriestHF) {
            const skill = new CSkillCure(this);
            skill.LoadData();
            skill.nCD = 5000;
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciDragon) {
            // this.bUninterruptible = true;
            //const skill = new CSkillRepeatRange(this);
            const skill = new CSkillOnce(this);

            skill.LoadData();
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciEyetyarnt) {
            // this.bUninterruptible = true;
            //const skill = new CSkillRepeatRange(this);
            const skill = new CSkillOnce(this);
            this.setMaxHP(50000);
            this.setHP(50000);

            skill.LoadData();
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciSkullSoldier) {
            // this.bUninterruptible = true;
            //const skill = new CSkillRepeatRange(this);
            this.setMaxHP(10000);
            this.setHP(10000);

            const skill = new CSkillOnce(this);

            skill.LoadData();
            this.skills.push(skill);
        }

        if (this.eCharId == eCCharacterID.eciSkullArcher) {
            this.setMaxHP(5000);
            this.setHP(5000);
            // this.bUninterruptible = true;
            //const skill = new CSkillRepeatRange(this);
            const skill = new CSkillLanche(this);

            skill.LoadData();
            skill.eMissile = eMissileId.emiArrowSkull;
            skill.nCD = 2000;
            this.skills.push(skill);
        }
    }

    playFlash(cb: Function) {
        if (this.aniFlash) {
            this.aniFlash.play(this.aniFlash.clips[0].name);
            this.aniFlash.once(Animation.EventType.FINISHED, () => {
                cb();
            })
        }

    }

    playCastEffect() {
        if (this.nodeCastEffect) {
            const ani: Animation = this.nodeCastEffect.getComponent(Animation);
            if (ani) {
                ani.play(ani.clips[0].name);
            }
        }
    }

    setInBattle(bIn: boolean) {
        console.log("进入战斗状态", bIn);
        this.bInBattle = bIn;
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

    onMissileFinished() {
        console.log("发射物完全命中目标，生命周期结束");
    }

    LauncheMissile(id: eMissileId) {
        const prefabMissile: Prefab = CResManager.instance.getMissilePrefab(id);
        const nodeMissile: Node = instantiate(prefabMissile);
        //const posMissile = this.node.position.clone().add(this.nodeLaunchePos.position);
        const posLaunche = this.nodeLaunchePos.worldPosition;
        let posMissileLocal = new Vec3();
        this.room.nodeBattleShowLayer.inverseTransformPoint(posMissileLocal, posLaunche);
        nodeMissile.setPosition(posMissileLocal);
        this.room.addMissile(nodeMissile);
        const comMissile: CMissile = nodeMissile.getComponent(CMissile);
        comMissile.setCaster(this);
        comMissile.LauncheWithTarget(posLaunche, this.charTar.getCenterPosByWorld());
    }

    onLauncheMissile() {
        this.curSkill.LauncheMissile();
    }

    onStrikeTargets() {
        for (let i = 0; i < this.arrTargets.length; ++i) {
            const char = this.arrTargets[i];
            char.onHited();
        }
    }

    onAniKeyFrame(event: CustomEvent) {
        // console.log("关键帧事件触发:", event.detail)
        switch (event.detail.para) {
            case eKeyFrameEvent.ekeHited:
                // this.charTar.onHited();
                this.onStrikeTargets();
                break;
            case eKeyFrameEvent.ekeLaunche:
                this.onLauncheMissile();
                break;
        }
    }

    popDamage(damage: number) {
        const nodePopInfo = instantiate(CResManager.instance.popInfo);
        const comPopInfo = nodePopInfo.getComponent(CPopInfo);
        comPopInfo.setText("-" + damage.toString());

        nodePopInfo.position = this.node.position;
        nodePopInfo.parent = this.node.parent;

        let posY = this.node.getComponent(UITransform).height * 0.5;

        //初始高度不超过120
        posY = posY > 120 ? 120 : posY;

        nodePopInfo.y += posY;
    }

    onDead() {
        if (this.eState != eBattleState.ebsDead) {
            this.eState = eBattleState.ebsDead;
            this.bIsAlive = false;
            this.playDead(() => {
                fadeInOut(this.node, 0.5, false, () => {
                    this.deleteSelf();
                })
            });
        }

    }

    onDamage() {
        let damage: number = 999;
        this._HP -= damage;
        this.popDamage(damage);
        if (this._HP <= 0) {
            this._HP = 0;
            this.onDead();
        }
        this.refreshHPBar();
    }

    refreshHPBar() {
        this.comStatuBar.setHP(this._HP);
    }

    popHealPoint(hp: number) {
        const nodePopInfo = instantiate(CResManager.instance.popInfo);
        const comPopInfo = nodePopInfo.getComponent(CPopInfo);
        comPopInfo.setText("+" + hp.toString());
        comPopInfo.setColor(new Color(0, 255, 0, 255));

        nodePopInfo.position = this.node.position;
        nodePopInfo.parent = this.node.parent;

        let posY = this.node.getComponent(UITransform).height * 0.5;

        //初始高度不超过120
        posY = posY > 120 ? 120 : posY;

        nodePopInfo.y += posY;
    }

    onHeal() {
        let cure = 999;
        this._HP += cure;
        this.popHealPoint(cure);
    }

    onHitedReady(caster: CCharacter) {
        this.hitedcaster = caster;
    }

    //受击表现，可能在两个时机播放，一时如果配置了关键帧，那么在关键就会执行这个函数。
    //如果攻击动作没配置关键帧，将在攻击动画完毕后调用这个函数
    onHited() {
        if (this.hitedcaster) {
            // console.log(this.eCharId, "受击", this.hitedcaster);

            //非站立状态或霸体状态只闪红
            if (this.eState != eBattleState.ebsStand || this.bUninterruptible) {
                this.blinkRed();
                this.scheduleOnce(() => {
                    this.blinkRestore();
                }, 0.2)
            } else {
                this.stopSkillEffect();
                this.bHited = true;
                this.eState = eBattleState.ebsHited;
                this.playHited(() => {
                    this.bHited = false;
                    // this.eState = eBattleState.ebsStand;
                    return true;
                });
            }
            this.onDamage();

            this.hitedcaster = null;
        }

    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }


    maxSkillRange: number = 0;
    //选择一个技能
    onSelectSkill() {
        //角色现在优先使用技能范围最远的距离，以后再来细调AI，如果有敌人在附近，切换使用近程技能        
        for (let i = 0; i < this.skills.length; ++i) {
            const skill = this.skills[i];
            if (skill.nSkillRange > this.maxSkillRange) {
                if (skill.IsCoolDown()) {
                    // console.log("设置技能", skill);
                    this.curSkill = skill;
                    this.maxSkillRange = skill.nSkillRange;
                }
            }
        }

    }

    //检查自身跟前是否有敌对目标，不能穿过敌对目标
    onCheckFaceTarget() {
        if (this.IsToDirRight()) {

        }
    }

    //选择一个目标
    onSelectTarget() {
        //如果有技能，并且没有目标或目标已失效。要重新选择目标
        if (this.curSkill) {
            if (this.curSkill.IsRangeAffect()) {
                //范围内只有cd到了才确认目标，并且稍后马上施放技能
                if (this.curSkill.IsCoolDown()) {
                    this.curSkill.onConfirmTargets();
                    this.arrTargets = this.curSkill.arrTargets;
                    //还是要个最近的目标好持续接近
                    this.charTar = this.curSkill.SearchNearestTarget();
                }
            } else {
                //if (!this.curSkill.hasTarget() || !this.curSkill.hasValidTarget()) {
                this.curSkill.OnSelectTarget();
                this.arrTargets = [];
                this.charTar = this.curSkill.target;
                this.arrTargets.push(this.curSkill.target);
                //}
            }
        }
        // this.charTar = this.curSkill.SearchNearestTarget();
    }


    playSkillEffect() {
        if (this.nodeSkillCast && this.aniSkillCast) {
            this.node.setSiblingIndex(-1);
            this.nodeSkillCast.active = true;
            this.aniSkillCast.play(this.aniSkillCast.clips[0].name);
        }
    }

    stopSkillEffect() {
        if (this.nodeSkillCast && this.aniSkillCast) {
            this.aniSkillCast.stop();
            this.nodeSkillCast.active = false;
        }
    }

    SwitchToStand() {
        // console.log("准备切换回标准站立", this.eState);
        if (this.eState != eBattleState.ebsStand && this.eState != eBattleState.ebsDead) {
            // console.log("切换回标准站立");
            this.stopSkillEffect();
            this.playStand();
            this.eState = eBattleState.ebsStand;
        }
    }


    async CastUltimateSkill() {
        let affectChars = this.arrTargets;
        affectChars.push(this);
        this.room.ShowRoleAction(affectChars, () => {
            return new Promise((resolve) => {
                this.playFlash(() => {
                    this.curSkill.doCast(() => {
                        resolve(true);
                    });
                });
            });
        })
    }

    async CastSkill() {
        //如果是飞行，先尝试结束飞行
        if (this.eFlystate == eFlyState.efsFly) {
            await this.EndFly();
        }

        //要不在飞行状态才开始播技能
        if (this.eFlystate == eFlyState.efsNone) {
            // console.log("准备放技能");
            if (this.eState != eBattleState.ebsSkill && this.curSkill.IsCoolDown()) {
                this.eState = eBattleState.ebsSkill;
                if (this.curSkill.bIsUltimate) {
                    this.CastUltimateSkill();
                } else {
                    this.curSkill.doCast();
                }
                // console.log("释放技能");

            }
        }
    }

    CloseToTarget() {
        //随时调整朝向
        this.onRunToTarget();
        if (this.eState != eBattleState.ebsRun) {
            this.eState = eBattleState.ebsRun;
            //this.playRun();
            if (this.eCharId == eCCharacterID.eciDragon) {
                this.StartFly();
            } else {
                this.playRun();
            }
        }
    }

    //战斗AI
    async BattleAITick() {
        //选择技能
        this.onSelectSkill();

        //选择目标
        this.onSelectTarget();

        //如果有技能，又没有在释放技能，开始走索敌流程
        if (this.curSkill && this.eState != eBattleState.ebsSkill) {


            if (this.curSkill.NeedTick()) {
                //如果技能正在生效，执行技能tick
                this.curSkill.Tick()
            } else {
                //范围技能和单体技能走不同流程
                if (this.curSkill.IsRangeAffect()) {
                    //范围技能至少要有两个目标才释放
                    console.log("看一下现在的目标组", this.arrTargets)
                    if (this.arrTargets.length > 1) {
                        this.CastSkill()
                    } else {
                        //否则继续向目标靠近
                        this.CloseToTarget();
                    }
                } else {
                    //否则检查有无目标，有目标走索敌流程
                    if (this.curSkill.hasValidTarget()) {
                        this.curSkill.OnCheckTargetDistance();

                        //距离之内，向目标移动
                        if (this.curSkill.IsCanCastByDistance()) {
                            this.CastSkill();
                        } else {
                            //如果是距离不够，要向目标靠近
                            this.CloseToTarget();
                        }
                    } else {
                        //没有目标就站着不动吧
                        this.SwitchToStand();
                    }

                }
            }
        }
    }

    StartFly() {
        this.eFlystate = eFlyState.efsFly;
        this.play("flyStart", () => {
            this.play("fly");
            return false;
        })
    }



    async EndFly(): Promise<void> {
        this.eFlystate = eFlyState.efsFlyEnd;
        return new Promise((resolve) => {
            this.play("flyend", () => {
                resolve(); // 核心：动画播放完毕后，通知外层的 await 继续执行
                this.eFlystate = eFlyState.efsNone;
                return true;
            });
        });
    }

    onRunToTarget() {
        if (this.charTar) {
            if (this.charTar.getPosition() > this.getPosition()) {
                this.moveDirection = eDirction.edRight;
            } else {
                this.moveDirection = eDirction.edLeft;
            }
        }
    }

    handleMove(dt: number) {
        //最后加个距离判断，避免和目标叠在一起
        if (this.eState == eBattleState.ebsRun && !this.curSkill.IsCanCastByDistance() && this.getDistance(this.charTar) > 5) {
            let pos = this.getPosition();
            let speed = this.runSpeed;

            // console.log("移动关键参数", this.moveDirection, speed);
            pos += speed * this.moveDirection * dt;

            // console.log("重新设置pos坐标", pos);
            this.setPosition(pos);
        }
    }

    AITick() {
        if (this.IsAlive()) {
            if (this.bInBattle) {
                this.BattleAITick();
            } else {
                super.AITick();
            }
        }

    }


    UpdateMove(deltaTime: number) {
        if (this.charTar) {
            this.handleMove(deltaTime);
        } else {
            this.SwitchToStand();
        }
    }

    update(dt: number) {
        //在受击不执行其它任何操作
        if (this.bHited) return;

        super.update(dt);
    }
}


