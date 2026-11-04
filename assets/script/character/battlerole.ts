import { gameStateMgr } from '../GameStateMgr';
import { _decorator, Vec3, Enum, Component, Animation, Node, NodePool, Color, bits, UITransform, UIOpacity, director, Prefab, instantiate, tween, Tween, Canvas, ParticleSystem2D, isValid, Sprite, SpriteFrame } from 'cc';
import { COverseer } from './overseer';
import { eBattleCamp, eCCharacterID, eDirction, eMissileId, eSkillActionType } from '../BaseDef';
import { CCharactersManager } from '../CharacaterMannager';
import { CSkillBase } from '../skills/skillbase';
import type { ISkillEffectData } from '../skills/skillbase';
import { fadeInOut, waitFadeInout } from '../common/common';
import { CCharacter } from './character';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { CResManager } from '../ResManager';
import { CMissile } from '../skills/missile';
import { CPopInfo } from '../PopInfo';
import { CStatuBar } from '../StatuBar';
import { CSkillFactory } from '../skills/gskillFactroy';
import { IHeros, HerosData } from '../config/Heros';
import { IMonsters, MonstersData } from '../config/Monsters';



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
const exclamationPool = new NodePool();

@ccclass('CBattleRole')
export class CBattleRole extends COverseer {

    @property({ type: Node, tooltip: "技能附加效果" })
    nodeSkillCast: Node = null;

    @property({ type: Animation, tooltip: "技能附加效果动画" })
    aniSkillCast: Animation = null;

    @property({ type: Animation, tooltip: "大招闪光" })
    aniFlash: Animation = null


    @property({ type: ParticleSystem2D, tooltip: "技能起手粒子特效" })
    p2dSkillStart: ParticleSystem2D = null;

    //是否在战斗状态，对于魔王军来说，有可能是在房间巡逻或监工或者只是展示
    bInBattle: boolean = false;

    // 仅小入侵角色设置：没有存活守军时继续走出右边界。
    invasionExitX: number | null = null;
    reinforcementTargetX: number | null = null;

    // 部署演出独立于战斗 AI，双方列阵完毕前不参与选敌、施法和碰撞。
    private deploymentMode: 'patrol' | 'hold' | 'march' | null = null;
    private deploymentDelay = 0;
    private deploymentTargetX = 0;
    private deploymentFace: eDirction = eDirction.edLeft;
    private patrolLeft = 0;
    private patrolRight = 0;
    private exclamation: Node = null;

    private resetDeployment() {
        this.setInBattle(false);
        this.nodeChar?.getComponent(Animation)?.off(Animation.EventType.FINISHED);
        for (const skill of this.skills) skill.CancelCast();
        this.stopSkillEffect();
        this.bHited = false;
        this.bCasting = false;
        this.bUninterruptible = false;
        if (this.sprChar) this.blinkRestore();
        this.bNeedRun2Pos = false;
        this.cbRun2Position = null;
        this.reinforcementTargetX = null;
        this.curSkill = null;
        this.charTar = null;
        this.arrTargets = [];
        this.eState = eBattleState.ebsStand;
        this.playStand();
    }

    startDeploymentPatrol(left: number, right: number) {
        this.resetDeployment();
        this.hideExclamation();
        this.deploymentMode = 'patrol';
        this.deploymentDelay = 2;
        this.patrolLeft = left;
        this.patrolRight = Math.max(left, right);
        this.moveDirection = Math.random() < 0.5 ? eDirction.edLeft : eDirction.edRight;
    }

    holdDeployment() {
        this.resetDeployment();
        this.deploymentMode = 'hold';
    }

    marchToDeployment(x: number, face: eDirction) {
        this.resetDeployment();
        this.deploymentMode = 'march';
        this.deploymentTargetX = x;
        this.deploymentFace = face;
    }

    isDeploymentReady(): boolean { return this.deploymentMode === 'hold'; }

    startDeploymentBattle() {
        this.hideExclamation();
        this.deploymentMode = null;
        this.setInBattle(true);
        this.aiBoostTime = 0;
        this.SwitchToStand();
    }

    showExclamation(frame: SpriteFrame) {
        this.setDirection2Left();
        if (!frame) return;
        if (this.exclamation && isValid(this.exclamation, true)) {
            this.exclamation.getComponent(Sprite).spriteFrame = frame;
            this.syncExclamationFacing();
            return;
        }
        let node = exclamationPool.get();
        if (!node) {
            node = new Node('Exclamation');
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            node.getComponent(UITransform).setContentSize(42, 39);
            node.addComponent(UIOpacity);
        }
        node.layer = this.node.layer;
        node.parent = this.node;
        node.active = true;
        node.getComponent(Sprite).spriteFrame = frame;
        this.exclamation = node;
        this.syncExclamationFacing();
        const sign = this.node.scale.x < 0 ? -1 : 1;
        const opacity = node.getComponent(UIOpacity);
        opacity.opacity = 255;
        node.setScale(0, 0, 1);
        // 0.3 秒放大到 1.2 倍，随后 0.9 秒缩回原尺寸并同时渐隐。
        tween(node).to(0.3, { scale: new Vec3(sign * 1.2, 1.2, 1) }, { easing: 'quadOut' })
            .to(0.9, { scale: new Vec3(sign, 1, 1) }, {
                onUpdate: (_target, ratio) => { opacity.opacity = 255 * (1 - ratio); }
            })
            .call(() => this.hideExclamation()).start();
    }

    isShowingExclamation(): boolean { return !!this.exclamation && isValid(this.exclamation, true); }

    private syncExclamationFacing() {
        const node = this.exclamation;
        if (!node || !isValid(node, true)) return;
        const body = this.node.getComponent(UITransform);
        // 跑位会改变父节点朝向，持续抵消翻转，使图标始终位于屏幕右上方。
        const sign = this.node.scale.x < 0 ? -1 : 1;
        node.setPosition(sign * (body.width * 0.3 + 12), body.height * (1 - body.anchorY) + 18, 0);
        node.setScale(sign * Math.abs(node.scale.x), node.scale.y, 1);
    }

    private hideExclamation() {
        if (this.exclamation && isValid(this.exclamation, true)) {
            Tween.stopAllByTarget(this.exclamation);
            this.exclamation.active = false;
            this.exclamation.getComponent(Sprite).spriteFrame = null;
            exclamationPool.put(this.exclamation);
        }
        this.exclamation = null;
    }

    static clearExclamationPool() { exclamationPool.clear(); }

    Release() {
        this.hideExclamation();
        super.Release();
    }

    private updateDeployment(dt: number) {
        if (this.deploymentMode === 'hold') return;
        // 晚部署的角色也必须等自己的警觉演出完成，不能带着感叹号跑位。
        if (this.deploymentMode === 'march' && this.isShowingExclamation()) return;
        if (this.deploymentMode === 'patrol') {
            if (this.deploymentDelay > 0) {
                this.deploymentDelay = Math.max(0, this.deploymentDelay - dt);
                return;
            }
            if (this.eState !== eBattleState.ebsRun) {
                this.eState = eBattleState.ebsRun;
                this.play(this.hasWalkAnimation() ? 'walk' : 'run');
            }
            let x = this.getPosition() + this.moveDirection * this.runSpeed * 0.5 * dt;
            if (x >= this.patrolRight) { x = this.patrolRight; this.setDirection2Left(); }
            if (x <= this.patrolLeft) { x = this.patrolLeft; this.setDirection2Right(); }
            this.setPosition(x);
            return;
        }
        const delta = this.deploymentTargetX - this.getPosition();
        const step = this.runSpeed * dt;
        if (Math.abs(delta) <= step) {
            this.setPosition(this.deploymentTargetX);
            this.deploymentMode = 'hold';
            this.moveDirection = this.deploymentFace;
            this.eState = eBattleState.ebsStand;
            this.playStand();
        } else {
            this.moveDirection = delta > 0 ? eDirction.edRight : eDirction.edLeft;
            if (this.eState !== eBattleState.ebsRun) { this.eState = eBattleState.ebsRun; this.playRun(); }
            this.setPosition(this.getPosition() + Math.sign(delta) * step);
        }
    }

    private hasWalkAnimation(): boolean {
        return !!this.nodeChar?.getComponent(Animation)?.getState('walk');
    }

    private shouldLeaveInvasion(): boolean {
        return this.invasionExitX !== null && this.bInBattle &&
            !CCharactersManager.instance.hasLivingEnemy(this, eBattleCamp.ebcDemon);
    }

    // 用房间横向边界判断入场，不依赖镜头纵向位置，避免滚动楼层影响后台战斗。
    // 返回角色父节点坐标系中的入场目标 X；身体完整进入战场后返回 null。
    private getBattlefieldEntryX(): number | null {
        const bounds = this.room?.tfBase;
        const body = this.node?.getComponent(UITransform);
        const parent = this.node?.parent?.getComponent(UITransform);
        if (!bounds || !body || !parent) return null;

        const toRoomX = (x: number) => bounds.convertToNodeSpaceAR(
            body.convertToWorldSpaceAR(new Vec3(x, 0, 0))).x;
        const a = toRoomX(-body.width * body.anchorX);
        const b = toRoomX(body.width * (1 - body.anchorX));
        const left = -bounds.width * bounds.anchorX;
        const right = bounds.width * (1 - bounds.anchorX);
        const offset = Math.min(a, b) < left ? left - Math.min(a, b)
            : Math.max(a, b) > right ? right - Math.max(a, b) : 0;
        if (Math.abs(offset) < 0.01) return null;

        const center = bounds.convertToNodeSpaceAR(this.node.worldPosition);
        center.x += offset;
        return parent.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(center)).x;
    }

    private enterBattlefield(targetX: number) {
        this.moveDirection = targetX > this.getPosition() ? eDirction.edRight : eDirction.edLeft;
        if (this.eState !== eBattleState.ebsRun) {
            this.eState = eBattleState.ebsRun;
            this.playRun();
        }
    }

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
    arrHitedStriker: CCharacter[] = [];

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

    nodeImpact: Node = null;

    start() {


        this.nHalfWidth = this.node.getComponent(UITransform).width / 2;

        this.nodeLaunchePos = this.node.getChildByName('lanchepos');

        this.nodeCastEffect = this.node.getChildByName("cast_effect");

        this.nodeImpact = this.node.getChildByName("impact");

        if (this.nodeSkillCast) {
            this.nodeSkillCast.active = false;
        }

        if (this.nodeImpact) {
            this.nodeImpact.active = false;
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

    config: IHeros | IMonsters = null;
    ATK: number = 0;
    DEF: number = 0;
    MDF: number = 0;
    INT: number = 0;
    SPD: number = 0;
    LCA: number = 0;
    ResisFire: number = 0;
    ResisIce: number = 0;
    ResisWind: number = 0;
    ResisThunder: number = 0;
    ResisDark: number = 0;
    ResisShine: number = 0;

    loadSkillData(nSkillId: number): CSkillBase {
        const skill = CSkillFactory.CreateSkill(this, nSkillId);
        this.skills.push(skill);
        return skill;
    }

    loadData() {
        const isHero = this.eCharId > eCCharacterID.eciHerosStart;
        const configId = isHero ? this.eCharId - eCCharacterID.eciHerosStart : this.eCharId;
        const cfg = isHero ? HerosData[configId] : MonstersData[configId];
        if (!cfg) {
            throw new Error(`Missing ${isHero ? 'hero' : 'monster'} config for character ${this.eCharId}`);
        }

        // 先生成全部技能，配置错误时不覆盖现有角色数据。
        const skills: CSkillBase[] = [];
        for (const value of [cfg.Skill1, cfg.Skill2, cfg.Skill3]) {
            const text = String(value ?? '').trim();
            if (!text || text === 'undefined' || text === 'null' || text === '0') continue;
            const id = Number(text);
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error(`Invalid skill ID "${text}" for character ${this.eCharId}`);
            }
            skills.push(CSkillFactory.CreateSkill(this, id));
        }

        this.config = cfg;
        this.nCamp = isHero ? eBattleCamp.ebcHero : eBattleCamp.ebcDemon;
        this.setMaxHP(cfg.HP);
        this.setHP(cfg.HP);
        this.setMaxMP(cfg.MP);
        this.setMP(cfg.MP);
        this.ATK = cfg.ATK;
        this.DEF = cfg.DEF;
        this.MDF = cfg.MDF;
        this.INT = cfg.INT;
        this.SPD = cfg.SPD;
        this.LCA = cfg.LCA;
        this.ResisFire = cfg.ResisFire;
        this.ResisIce = cfg.ResisIce;
        this.ResisWind = cfg.ResisWind;
        this.ResisThunder = cfg.ResisThunder;
        this.ResisDark = cfg.ResisDark;
        this.ResisShine = cfg.ResisShine;
        this.skills = skills;
        this.curSkill = null;
        this.charTar = null;
        this.arrTargets = [];
        this.maxSkillRange = 0;
    }

    playFlash(cb: Function) {
        if (this.aniFlash) {
            this.aniFlash.play(this.aniFlash.clips[0].name);
            this.aniFlash.once(Animation.EventType.FINISHED, () => {
                cb();
            })
        } else {
            cb();
        }

    }

    playCastEffect() {
        if (this.nodeCastEffect) {
            const ani: Animation = this.nodeCastEffect.getComponent(Animation);
            if (ani) {
                ani.play(ani.clips[0].name);
            }
        }

        if (this.p2dSkillStart) {
            this.p2dSkillStart.resetSystem();
        }
    }

    getInBattle(): boolean {
        return this.bInBattle;
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
        // console.log("发射物完全命中目标，生命周期结束");
    }

    LauncheMissile(id: eMissileId, target: CCharacter, effect: ISkillEffectData) {
        if (!this.IsAlive() || !target?.IsAlive() || !isValid(target.node) || !this.nodeLaunchePos) return;
        console.log("LauncheMissile", id);
        const prefabMissile: Prefab = CResManager.instance.getMissilePrefab(id);
        if (!prefabMissile) {
            console.error('飞行物预制体未配置', id, '角色', this.eCharId);
            return;
        }
        const nodeMissile: Node = instantiate(prefabMissile);
        //const posMissile = this.node.position.clone().add(this.nodeLaunchePos.position);
        const posLaunche = this.nodeLaunchePos.worldPosition;
        let posMissileLocal = new Vec3();
        this.room.nodeBattleShowLayer.inverseTransformPoint(posMissileLocal, posLaunche);
        nodeMissile.setPosition(posMissileLocal);
        this.room.addMissile(nodeMissile);
        const comMissile: CMissile = nodeMissile.getComponent(CMissile);
        comMissile.setCaster(this, effect);
        comMissile.LauncheWithTarget(posLaunche, target.getCenterPosByWorld());
    }

    onLauncheMissile() {
        //只有还活着才发射
        if (this.IsAlive()) {
            this.curSkill?.LauncheMissile();
        }
    }

    onStrikeTargets(effect: ISkillEffectData) {
        for (let i = 0; i < this.arrTargets.length; ++i) {
            const char = this.arrTargets[i];
            if (char?.IsAlive() && isValid(char.node)) char.onHited(this, effect);
        }
    }

    onAniKeyFrame(event: CustomEvent) {
        // console.log("关键帧事件触发:", event.detail)
        switch (event.detail.para) {
            case eKeyFrameEvent.ekeHited:
                // this.charTar.onHited();
                this.curSkill?.OnAnimationHit();
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


    //播放死亡击飞出屏幕动画
    public playDeathFlyOut() {
        // 1. 清理该节点上可能存在的其他缓动
        Tween.stopAllByTarget(this.node);

        const canvas = director.getScene().getComponentInChildren(Canvas);
        this.node.setParent(canvas.node, true);

        // 2. 确定飞出方向
        // 面朝右则向左后方飞（X减少），面朝左则向右后方飞（X增加）
        const flyDirX = this.IsToDirRight() ? -1 : 1;

        // 3. 设置飞出距离和高度（直接给大数值，确保飞出屏幕）
        const startPos = this.node.position.clone();
        const flyDistanceX = 1500 * flyDirX; // 水平飞出 1500 像素
        const flyHeightY = 600;              // 抛物线最高点相对起点增高 600 像素
        const targetPosX = startPos.x + flyDistanceX;

        // 4. 动画时长
        const duration = 5; // 0.8秒飞出屏幕，时间越短速度越快

        // 5. 位移动画：X轴和Y轴拆开处理，完美控制45度弹飞与弧度
        tween(this.node)
            .to(duration, { position: new Vec3(targetPosX, startPos.y, 0) }, {
                easing: 'quadOut', // 瞬间弹出，随后在水平方向略微减速
                onUpdate: (target: any, ratio: number) => {
                    // 使用正弦函数模拟 Y 轴的抛物线 (0 -> 1 -> 0)
                    // 如果希望飞出屏幕上方不掉下来，可以调整曲线或直接加上线性上升
                    let currentY = startPos.y + Math.sin(ratio * Math.PI) * flyHeightY;

                    // 保持 X 轴由 Tween 计算的结果，仅动态修改 Y 轴
                    let currentPos = this.node.position.clone();
                    currentPos.y = currentY;
                    this.node.position = currentPos;
                }
            }).call(() => {
                //表现完毕删除自己
                this.deleteSelf();
            })
            .start();

        // 6. 幽默感自转动画：在飞出过程中疯狂 360 度旋转
        // 根据飞出方向决定顺时针还是逆时针旋转
        const rotateDirection = this.IsToDirRight() ? 1 : -1;
        const rotateSpeed = 0.1;         // 转一圈（360度）的时间，越小转得越疯狂

        tween(this.node)
            .by(rotateSpeed, { angle: 360 * rotateDirection }) // 根据方向决定顺/逆时针
            .repeatForever() // 没被销毁前一直转
            .start();
    }


    private dropLoot() {
        if (gameStateMgr.online) return;
        if (this.eCharId <= eCCharacterID.eciHerosStart || !this.room) return;
        const dropId = (this.config as IHeros)?.Dropid;
        if (!dropId) return;
        try {
            const body = this.node.getComponent(UITransform);
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_drop_loot, true, {
                dropId, room: this.room, ground: this.node.worldPosition.clone(),
                start: body.convertToWorldSpaceAR(new Vec3(0, body.height * 0.5, 0)),
            }));
        } catch (error) {
            console.error(`[掉落] 英雄 ${this.eCharId}, Dropid ${dropId}`, error);
        }
    }

    onDead() {
        if (this.eState != eBattleState.ebsDead) {
            this.eState = eBattleState.ebsDead;
            this.bIsAlive = false;
            this.dropLoot();
            this.onBattleDeath?.(this);


            if (this.nodeImpact) {
                this.nodeImpact.active = true;

                this.nodeImpact.setParent(this.room.nodeCharLayer, true);
                const p2d = this.nodeImpact.getComponent(ParticleSystem2D);
                p2d.resetSystem();
                this.scheduleOnce(() => {
                    this.playDeathFlyOut();
                }, 0.2)

                // const ani = this.nodeImpact.getComponent(Animation);
                // ani.play(ani.clips[0].name);
                // ani.once(Animation.EventType.FINISHED, () => {
                //     this.playDeathFlyOut();
                // })

            } else {
                this.playDead(() => {
                    fadeInOut(this.node, 0.5, false, () => {
                        this.deleteSelf();
                    })
                });
            }
        }

    }

    onDamage(damage: number) {
        damage = Math.max(0, damage);
        this._HP -= damage;
        this.popDamage(damage);
        if (this._HP <= 0) {
            this._HP = 0;
            this.onDead();
        }
        this.refreshHPBar();
    }

    refreshHPBar() {
        this.comStatuBar?.setHP(this._HP);
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

    onHeal(cure: number) {
        if (!this.IsAlive()) return;
        cure = Math.min(Math.max(0, cure), this._MaxHP - this._HP);
        this._HP += cure;
        this.popHealPoint(cure);
        this.refreshHPBar();
    }

    onHitedReady(caster: CCharacter) {
        //this.arrHitedStriker.push(caster);
    }

    //受击表现，可能在两个时机播放，一时如果配置了关键帧，那么在关键就会执行这个函数。
    //如果攻击动作没配置关键帧，将在攻击动画完毕后调用这个函数
    onHited(caster: CCharacter, effect: ISkillEffectData) {
        if (!this.IsAlive()) return;

        if (caster) {
            // console.log(this.eCharId, "受击", this.arrHitedStriker);

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
            let damage = effect.power;
            if (effect.skillType === eSkillActionType.esatPyhsisc) damage -= this.DEF;
            else if (effect.skillType === eSkillActionType.esatMagic) damage -= this.MDF;
            this.onDamage(damage);
        }

    }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.hideExclamation();
        this.stopListnerEvent();
    }


    maxSkillRange: number = 0;
    //选择一个技能
    onSelectSkill() {
        if (this.eState === eBattleState.ebsSkill) return;
        let movementSkill: CSkillBase = null;
        let readySkill: CSkillBase = null;
        for (const skill of this.skills) {
            skill.OnSelectTarget();
            if (skill.IsRangeAffect()) {
                if (skill.target) this.moveDirection = skill.target.getPosition() < this.getPosition()
                    ? eDirction.edLeft : eDirction.edRight;
                skill.onConfirmTargets();
            }
            skill.OnCheckTargetDistance();
            if (skill.target && (!movementSkill || skill.nSkillRange > movementSkill.nSkillRange)) {
                movementSkill = skill;
            }
            const inRange = skill.IsRangeAffect() ? skill.arrTargets.length > 0 : skill.IsCanCastByDistance();
            if (skill.IsCoolDown() && skill.hasValidTarget() && inRange &&
                (!readySkill || (skill.bIsUltimate && !readySkill.bIsUltimate))) {
                readySkill = skill;
            }
        }
        this.curSkill = readySkill || movementSkill;
        this.maxSkillRange = this.curSkill?.nSkillRange || 0;
    }

    onCheckFaceTarget() {
        if (this.IsToDirRight()) {

        }
    }

    //选择一个目标
    onSelectTarget() {
        if (this.eState === eBattleState.ebsSkill) return;
        this.charTar = this.curSkill?.target || null;
        this.arrTargets = this.curSkill
            ? (this.curSkill.IsRangeAffect() ? this.curSkill.arrTargets : (this.charTar ? [this.charTar] : []))
            : [];
        if (this.charTar) this.moveDirection = this.charTar.getPosition() < this.getPosition()
            ? eDirction.edLeft : eDirction.edRight;
    }

    playSkillEffect() {
        if (this.nodeSkillCast) {
            this.node.setSiblingIndex(-1);
            this.nodeSkillCast.active = true;
            // this.nodeSkillCast.children[0].getComponent(ParticleSystem2D).resetSystem();
            if (this.aniSkillCast) {
                this.aniSkillCast.play(this.aniSkillCast.clips[0].name);
            }

        }
    }

    stopSkillEffect() {
        if (this.nodeSkillCast) {
            this.nodeSkillCast.active = false;

            if (this.aniSkillCast) {
                this.aniSkillCast.stop();
            }

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
        const affectChars = [...this.arrTargets];
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
        if (this.reinforcementTargetX !== null) {
            this.enterBattlefield(this.reinforcementTargetX);
            return;
        }
        const entryX = this.getBattlefieldEntryX();
        if (entryX !== null) {
            this.enterBattlefield(entryX);
            return;
        }
        //如果是飞行，先尝试结束飞行
        if (this.eFlystate == eFlyState.efsFly) {
            await this.EndFly();
        }

        //要不在飞行状态才开始播技能
        if (this.eFlystate == eFlyState.efsNone && this.getBattlefieldEntryX() === null) {
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
    BattleAITick() {
        if (this.shouldLeaveInvasion()) {
            this.charTar = null;
            this.arrTargets = [];
            if (this.eState !== eBattleState.ebsRun) {
                this.eState = eBattleState.ebsRun;
                this.setDirection2Right();
                this.playRun();
            }
            return;
        }
        if (this.reinforcementTargetX !== null) {
            this.enterBattlefield(this.reinforcementTargetX);
            return;
        }
        const entryX = this.getBattlefieldEntryX();
        if (entryX !== null) {
            this.enterBattlefield(entryX);
            return;
        }
        //选择技能
        this.onSelectSkill();

        //选择目标
        this.onSelectTarget();


        //如果有技能，又没有在释放技能，开始走索敌流程
        if (this.curSkill) {


            if (this.curSkill.NeedTick()) {
                //如果技能正在生效，执行技能tick
                this.curSkill.Tick()
            } else if (this.eState != eBattleState.ebsSkill) {
                //范围技能和单体技能走不同流程
                if (this.curSkill.IsRangeAffect()) {
                    // 范围技能有一个有效目标即可释放。
                    //console.log("看一下现在的目标组", this.arrTargets)
                    if (this.arrTargets.length > 0) {
                        if (this.curSkill.IsCoolDown()) this.CastSkill();
                        else this.SwitchToStand();
                    } else if (this.charTar) {
                        //否则继续向目标靠近
                        this.CloseToTarget();
                    } else {
                        this.SwitchToStand();
                    }
                } else {
                    //否则检查有无目标，有目标走索敌流程
                    if (this.curSkill.hasValidTarget()) {
                        this.curSkill.OnCheckTargetDistance();

                        //距离之内，向目标移动
                        if (this.curSkill.IsCanCastByDistance()) {
                            if (this.curSkill.IsCoolDown()) this.CastSkill();
                            else this.SwitchToStand();
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
        if (this.eState == eBattleState.ebsRun && this.curSkill && this.charTar?.IsAlive() && !this.curSkill.IsCanCastByDistance() && this.getDistance(this.charTar) > 5) {
            let pos = this.getPosition();
            let speed = this.runSpeed;

            // console.log("移动关键参数", this.moveDirection, speed);
            pos += speed * this.moveDirection * dt;

            // console.log("重新设置pos坐标", pos);
            this.setPosition(CCharactersManager.instance.getBlockedPosition(this, pos));
        }
    }

    AITick() {
        if (this.deploymentMode) return;
        if (this.IsAlive()) {
            if (this.bInBattle) {
                this.BattleAITick();
            } else {
                super.AITick();
            }
        }

    }


    UpdateMove(deltaTime: number) {
        if (!this.IsAlive()) return;
        if (this.deploymentMode) {
            this.updateDeployment(deltaTime);
            this.syncExclamationFacing();
            return;
        }
        if (this.shouldLeaveInvasion()) {
            this.setDirection2Right();
            this.setPosition(Math.min(this.invasionExitX, this.getPosition() + this.runSpeed * deltaTime));
            return;
        }
        if (this.reinforcementTargetX !== null) {
            const targetX = this.reinforcementTargetX;
            this.enterBattlefield(targetX);
            const delta = targetX - this.getPosition();
            const desired = this.getPosition() + Math.sign(delta) * Math.min(Math.abs(delta), this.runSpeed * deltaTime);
            const blocked = CCharactersManager.instance.getBlockedPosition(this, desired);
            this.setPosition(blocked);
            // 补位途中接敌就结束跑位命令，转入正常寻敌战斗，不能硬穿到预设站位。
            if (blocked !== desired || Math.abs(targetX - blocked) < 0.01) this.reinforcementTargetX = null;
            return;
        }
        const entryX = this.bInBattle ? this.getBattlefieldEntryX() : null;
        if (entryX !== null) {
            this.enterBattlefield(entryX);
            const delta = entryX - this.getPosition();
            const desired = this.getPosition() + Math.sign(delta) * Math.min(Math.abs(delta), this.runSpeed * deltaTime);
            this.setPosition(CCharactersManager.instance.getBlockedPosition(this, desired));
            return;
        }
        //有指定位置要优先处理
        if (this.bNeedRun2Pos) {
            const start = this.getPosition();
            this.handleRun2PositionMovement(deltaTime);
            const desired = this.getPosition();
            this.setPosition(start);
            this.setPosition(CCharactersManager.instance.getBlockedPosition(this, desired));
        } else if (this.charTar) {
            //然后才是朝向目标移动
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


