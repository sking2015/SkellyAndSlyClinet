import { CkeyValuePair } from '../KeyValuePair';
import { _decorator, Component, UITransform, Node, Animation, error, warn, Enum, math, Prefab, Sprite, color, ColorKey } from 'cc';
import { eCharPlace, eBattleCamp, eDirction, eCCharacterID } from '../BaseDef';
import { fadeInOut } from '../common/common';
import { CBaseRoom } from '../room/BaseRoom';
const { ccclass, property } = _decorator;

export const AI_INTERVAL = 0.1; // AI 0.1秒驱动一次

const ACT_STAND = 'stand';
const ACT_IDLE = 'idle';
const ACT_RUN = 'run';
const ACT_WALK = 'walk';
const ACT_WORK = 'work';
const ACT_LAND = 'land';
const ACT_HITED = 'hit';

@ccclass('CCharacter')
export class CCharacter extends Component {
    @property(CkeyValuePair)
    actionList: CkeyValuePair[] = [];

    @property({ type: Enum(eBattleCamp), tooltip: "角色阵营" })
    nCamp: eBattleCamp = eBattleCamp.ebcNone;

    private _animation: Animation | null = null;
    protected _currentActionKey: string = '';
    private _currentTimer: number = 0;       // 当前动作已持续时间
    private _targetDuration: number = 0;    // 当前动作目标持续时间（含波动）
    protected _moveDirection: eDirction = eDirction.edNone;     // 1 为右，-1 为左

    @property
    runSpeed: number = 100;

    @property
    limitLeft: number = -250;
    @property
    limitRight: number = 250;

    //角色动画节点
    nodeChar: Node = null;
    sprChar: Sprite = null;

    //角色灰度消像节点,用于一些特殊效果
    nodeGray: Node = null;

    nodeEffect: Node = null;

    bStone: boolean = false;

    // ====== 范围外回归专属变量 ======
    private _isReturningToRange: boolean = false; // 是否正在回归范围内
    private _returnTargetX: number = 0;           // 回归的目标X坐标

    // ====== 新增：动态权重管理映射 ======
    protected _currentWeights: Map<string, number> = new Map();


    ePlace: eCharPlace = eCharPlace.ecpNone;

    eCharId: eCCharacterID = eCCharacterID.eciNoe;

    //全局唯一索引，方便定位查找
    _index: number = -1;

    //所在房间
    room: CBaseRoom = null;

    bIsAlive: boolean = true;

    set index(i: number) {
        this._index = i;
    }

    get index(): number {
        return this._index;
    }

    //设置方向时一并改变朝向
    set moveDirection(ed: eDirction) {

        this._moveDirection = ed;

        let scale = this.node.scale.clone();


        scale.x = Math.abs(scale.x) * Number(this._moveDirection);
        this.node.setScale(scale);
    }

    get moveDirection(): number {
        return Number(this._moveDirection);
    }

    IsToDirRight(): boolean {
        return this._moveDirection == eDirction.edRight;
    }

    getHP(): number {
        return 0;
    }

    setHP(hp: number) {
    }

    setMaxHP(max: number) {

    }

    getHPPer(): number {
        return 0;
    }

    loadData() {

    }


    IsAlive(): boolean {
        return this.bIsAlive;
    }

    setInBattle(bIn: boolean) {

    }

    getBattleCamp(): eBattleCamp {
        return this.nCamp;
    }

    //设置位置，由于是横向游戏，并没有纵向坐标，直接返回x象素坐标
    setPosition(pos: number) {
        this.node.x = pos;
    }

    //取得位置，由于是横向游戏，并没有纵向坐标，直接返回x象素坐标
    getPosition(): number {
        return this.node.x;
    }

    nHalfWidth: number = 0;
    getRoleHalfWidth(): number {
        return this.nHalfWidth;
    }

    getDistance(char: CCharacter): number {
        //需要减去两边一半的体型，不然容易走来沾到一起
        // console.log("取得和目标距离先看四个关键参数", this.getPosition(), char.getPosition(), this.nHalfWidth, char.getRoleHalfWidth());
        return Math.abs(this.getPosition() - char.getPosition()) - this.nHalfWidth - char.getRoleHalfWidth();
    }

    //释放自己
    Release() {
        this.index = -1;
        this.node.destroy();
        this.node = null;
    }

    setRoom(room: CBaseRoom) {
        this.room = room;
    }

    getRoom(): CBaseRoom {
        return this.room;
    }

    protected onLoad(): void {
        console.log("CCharacter onLoad", this.node.name);

        this.nodeChar = this.node.getChildByName('char');
        if (!this.nodeChar) {
            console.error("can't find node char for character", this.node.name);
        }

        this.sprChar = this.nodeChar.getComponent(Sprite);

        this.nodeGray = this.node.getChildByName('gray');

        this.nodeEffect = this.node.getChildByName('effect')

        if (this.nodeGray) {
            this.nodeGray.active = false;
        }


        if (this.nodeEffect) {
            this.nodeEffect.active = false;
        }


        this._animation = this.nodeChar.getComponent(Animation);
        if (!this._animation) {
            error(`[CCharacter] 节点 ${this.node.name} 上未找到 Animation 组件！`);
            return;
        }
    }

    SetPlace(place: eCharPlace) {
        this.ePlace = place;
    }

    playEffect() {
        this.nodeEffect.active = true;
        const aniEffect = this.nodeEffect.getComponent(Animation);
        if (aniEffect) {
            const ani = aniEffect.clips[0].name;
            aniEffect.once(Animation.EventType.FINISHED, () => {
                this.nodeEffect.active = false;
            }, this)

            aniEffect.play(ani);
        }
    }

    //角色石化
    ToStone() {
        this._animation.stop();

        if (this.nodeGray) {
            this.nodeGray.active = true;
            fadeInOut(this.nodeGray, 0.5, true);
        }

        //this.nodeChar.active = false;

        this.bStone = true;
    }

    ResumeFromStone() {
        this.nodeChar.active = true;

        if (this.nodeGray) {
            fadeInOut(this.nodeGray, 0.5, false, () => {
                this.nodeGray.active == false;
                this.play(this.actionList[0].key);
            })
        }

        this.bStone = false;
    }

    start() {
        console.log("CCharacter start", this.node.name);

        // 校验 actionList
        this.actionList.forEach(item => {
            const key = item.key;
            if (key === ACT_RUN || key === ACT_WALK) {
                if (!this._animation!.getState(ACT_RUN) && !this._animation!.getState(ACT_WALK)) {
                    error(`[CCharacter] 动作列表中包含移动行为 "${key}"，但在 Animation 中找不到 "run" 或 "walk"！`);
                }
            } else {
                if (!this._animation!.getState(key)) {
                    error(`[CCharacter] 动作列表中定义的 "${key}" 在 Animation 组件中找不到！`);
                }
            }

            let baseDuration = parseFloat(item.value);
            if (isNaN(baseDuration) || baseDuration < 2) {
                warn(`[CCharacter] "${key}" 的持续时间低于2秒或无效，已重置为2秒。`);
                item.value = "2";
            }
        });

        this.nHalfWidth = this.node.getComponent(UITransform).width / 2;

        // 初始化权重环境
        this.resetWeightsToRoute();

        // 检查初始位置是否在活动范围外
        this.checkInitialPosition();
    }


    bEnableWork: boolean = true;
    //禁止工作，在房间里资源满了之后调用
    public EnableWork(bEnable: boolean) {
        this.bEnableWork = bEnable;
    }

    /** 依照规则初始化/重置各动作的意愿权重 */
    private resetWeightsToRoute() {
        this.actionList.forEach(item => {
            const key = item.key;
            if (key === ACT_WORK) {
                this._currentWeights.set(key, 10);
            } else if (key === ACT_IDLE || key === ACT_STAND) {
                this._currentWeights.set(key, 3);
            } else {
                // run, walk, tried 等休闲动作初始权重全为 0
                this._currentWeights.set(key, 0);
            }
        });
    }

    //重置某一动作权重为零
    private resetWeights(key: string) {
        if (this._currentWeights.has(key)) {
            this._currentWeights.set(key, 0);
        }
    }

    /** 基于当前动态权重池，加权随机抽取下一个动作 */
    private getRandomActionByWeight(): string {
        let totalWeight = 0;
        const validList: { key: string; weight: number }[] = [];

        this.actionList.forEach(item => {
            const key = item.key;
            const w = this._currentWeights.get(key) || 0;

            if (key == 'work') {
                console.log("现在的key是工作", key, w);
            }

            //当不允许工作时跳过这个键
            if (!this.bEnableWork && key == ACT_WORK) {
                return;
            }

            if (w > 0) {
                totalWeight += w;
                validList.push({ key, weight: w });
            }
        });

        // 极端兜底：如果全部权重都沦为0，返回列表中第一个可用的动作
        if (totalWeight <= 0) {
            return this.actionList[0]?.key || ACT_STAND;
        }

        // 加权随机滚轮算法
        let randomNum = Math.random() * totalWeight;
        for (const action of validList) {
            randomNum -= action.weight;
            if (randomNum <= 0) {
                return action.key;
            }
        }
        return validList[validList.length - 1].key;
    }

    /** 播放移动动画的统一调度方法 */
    private playMoveAnimation(preferRun: boolean): string {
        if (!this._animation) return '';

        const firstChoice = preferRun ? ACT_RUN : ACT_WALK;
        const secondChoice = preferRun ? ACT_WALK : ACT_RUN;

        if (this._animation.getState(firstChoice)) {
            this.play(firstChoice);
            return firstChoice;
        } else if (this._animation.getState(secondChoice)) {
            this.play(secondChoice);
            return secondChoice;
        } else {
            error(`[CCharacter] 节点 ${this.node.name} 尝试移动，但 Animation 中既没有 "run" 也没有 "walk"！`);
            this._currentActionKey = '';
            return '';
        }
    }

    //取得中心点，避免子弹打脚底
    getCenterPosByWorld(): math.Vec3 {
        let posWorld = this.node.worldPosition.clone();
        let uiTransform = this.node.getComponent(UITransform);

        if (uiTransform) {
            // 3. 计算怪物在世界坐标下的【实际缩放高度】
            // uiTransform.contentSize.height 是美术资源的原始高度
            // Math.abs(targetEnemyNode.worldScale.y) 是为了防止怪物翻转时缩放变成负数
            let realHeight = uiTransform.contentSize.height * Math.abs(this.node.worldScale.y);

            // 4. 将 Y 坐标向上修正高度的一半，精准指向怪物的胸口/中心
            posWorld.y += (realHeight / 2);
        }

        return posWorld;
    }

    /** 检查位置并决定是否开启回归模式 */
    private checkInitialPosition() {
        const currentX = this.node.position.x;

        if (currentX < this.limitLeft || currentX > this.limitRight) {
            this._isReturningToRange = true;

            const padding = 10;
            let minX = this.limitLeft + padding;
            let maxX = this.limitRight - padding;

            if (currentX > 0) {
                minX = 0;
            } else {
                maxX = 0;
            }

            this._returnTargetX = minX + Math.random() * (maxX - minX);

            // 外部刷新迫切回场：优先使用“跑(run)”
            const moveAction = this.playMoveAnimation(true);
            if (!moveAction) {
                this._isReturningToRange = false;
                return;
            }

            this.moveDirection = this._returnTargetX > currentX ? eDirction.edRight : eDirction.edLeft;
            console.log(`[CCharacter] 外部刷新开启回归。目标点: ${this._returnTargetX.toFixed(1)}`);
        } else {
            this.switchRandomAction();
        }
    }

    bPause: boolean = false;
    doPause() {
        console.log("暂停表现", this.eCharId);
        this.bPause = true;
        this._animation.pause();
    }

    doResuem() {
        console.log("恢复表现", this.eCharId);
        this.bPause = false;
        this._animation.resume()
    }

    playFlash(cb: Function) {

    }

    //在施放技能之前执行
    onBeforeCastSkill() {

    }

    //在技能动作之后执行
    onAfterCastSkill() {

    }

    //技能作用目标身上
    onCastSkillToTarget(char: CCharacter) {

    }

    /** 播放指定动画 */
    play(ani: string, cb?: Function) {
        if (this.bStone) return;



        // console.log("准备播放动画", ani);

        if (this._animation && this._animation.getState(ani)) {
            // console.log("播放动画", ani);            
            this._animation.play(ani);
            this._currentActionKey = ani;

            //除了站立动作外,需要响应播放完毕返回stand
            if (ani != ACT_STAND) {
                this._animation.once(Animation.EventType.FINISHED, () => {
                    // console.log("动画播放完毕...", ani);
                    if (cb) {
                        if (cb()) {
                            this.play(ACT_STAND);
                        }
                    } else {
                        this.play(ACT_STAND);
                    }

                }, this)
            }
        }
    }

    SwitchToStand() {
    }

    playStand() {
        this.play(ACT_STAND);
    }

    playRun() {
        this.play(ACT_RUN);
    }

    playLand() {
        console.warn("playLand~！！！");
        if (this._animation) {
            const ani = ACT_LAND;
            this._currentActionKey = ani;
            const landState = this._animation.getState(ani);

            if (landState) {
                landState.once(Animation.EventType.FINISHED, () => {
                    console.log('精准监听：落地动画播放完毕！');
                    this._currentActionKey = "";
                }, this);
            }
            this._currentTimer = 0;
            this._animation.play(ani);
        }
    }

    playAttack() {
        console.log("播放攻击动作")
    }

    blinkRed() {
        this.sprChar.color = color(255, 0, 0, 255);
    }

    blinkRestore() {
        this.sprChar.color = color(255, 255, 255, 255);
    }

    playHited(cb?: Function) {

        // if (this.eCharId == eCCharacterID.eciDragon) {
        //     console.log("为什么龙会执行到这里?");
        // }

        this.blinkRed();
        this.play(ACT_HITED, () => {
            this.blinkRestore();
            if (cb) {
                return cb();
            } else {
                return true;
            }
        });
    }

    onHitedReady(caster: CCharacter) {
        console.log("受击准备")
    }

    onHeal() {

    }

    onHited() {
        console.log("受击事件");
    }

    setRunSpeed(speed: number) {
        this.runSpeed = speed;
    }

    setActionRange(limitLeft: number, limitRight: number) {
        this.limitLeft = limitLeft;
        this.limitRight = limitRight;
    }

    ActionByWeightAI() {
        console.error("请在派生类实现这个函数")
    }

    /** AI 逻辑切换核心 */
    AITick() {
        if (this._isReturningToRange) return;

        this._currentTimer += AI_INTERVAL;

        this.ActionByWeightAI();

        // 如果达到目标时间，切换下一个动作
        if (this._currentTimer >= this._targetDuration) {
            this.switchRandomAction();
        }
    }

    /** 结合动态权重，挑选并初始化下一个行为 */
    private switchRandomAction() {
        if (this.actionList.length === 0) return;
        if (this._currentActionKey == ACT_LAND) return;

        // 【新规则拦截】如果刚才结束的动作是休息或者闲逛（不是work），表现完后它们的意愿值落地归零，重置整体环境
        if (this._currentActionKey && this._currentActionKey !== ACT_WORK) {
            this.resetWeights(this._currentActionKey);
        }

        // 1. 运用动态随机滚轮抽签
        const nextActionKey = this.getRandomActionByWeight();

        // 2. 获取并计算带正负30%波动的持续时间
        const config = this.actionList.find(item => item.key === nextActionKey) || this.actionList[0];
        const baseTime = parseFloat(config.value);
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
        this._targetDuration = baseTime * randomFactor;
        this._currentTimer = 0;

        // 3. 执行对应的动画分支
        if (nextActionKey === ACT_RUN || nextActionKey === ACT_WALK) {
            // 日常闲逛状态：优先使用“走(walk)”动画
            const moveAction = this.playMoveAnimation(false);
            if (moveAction) {
                this.moveDirection = Math.random() > 0.5 ? eDirction.edRight : eDirction.edLeft;
            }
        } else {
            this.play(nextActionKey);
        }

        //console.log(`[AI 决策] 抽中动作: ${nextActionKey}，计划持续: ${this._targetDuration.toFixed(1)}s。当前权重快照 ->`, Object.fromEntries(this._currentWeights));
    }

    UpdateMove(deltaTime: number) {
        if (this._isReturningToRange) {
            this.handleReturnMovement(deltaTime);
        } else if (this._currentActionKey === ACT_RUN || this._currentActionKey == ACT_WALK) {
            this.handleRunningMovement(deltaTime);
        }
    }

    aiBoostTime = 0;
    update(deltaTime: number) {

        if (this.bStone) return;

        if (this.bPause) return;

        this.aiBoostTime += deltaTime;
        if (this.aiBoostTime > AI_INTERVAL) {
            this.AITick();
            this.aiBoostTime = 0;
        }

        //如果在展台，不执行后面的行走
        if (this.ePlace == eCharPlace.ecpShow) {
            return;
        }

        this.UpdateMove(deltaTime);
    }

    /** 处理回归安全区间的位移 */
    private handleReturnMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        if (this._currentActionKey == ACT_WALK) {
            speed *= 0.5;
        }

        pos.x += speed * this.moveDirection * dt;

        let isArrived = false;
        if (this.moveDirection === eDirction.edRight && pos.x >= this._returnTargetX) {
            isArrived = true;
        } else if (this.moveDirection === eDirction.edLeft && pos.x <= this._returnTargetX) {
            isArrived = true;
        }

        if (isArrived) {
            pos.x = this._returnTargetX;
            this.node.setPosition(pos);
            this._isReturningToRange = false;
            console.log("[CCharacter] 角色已顺利入场，重置意愿池并激活日常工作循环。");

            // 入场后，强制刷新行为
            this.switchRandomAction();
        } else {
            this.node.setPosition(pos);
        }
    }

    /** 处理日常跑动位移与碰撞边界翻转 */
    private handleRunningMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        if (this._currentActionKey == ACT_WALK) {
            speed *= 0.5;
        }

        pos.x += speed * this.moveDirection * dt;

        if (pos.x >= this.limitRight) {
            pos.x = this.limitRight;
            this.moveDirection = eDirction.edLeft;
        } else if (pos.x <= this.limitLeft) {
            pos.x = this.limitLeft;
            this.moveDirection = eDirction.edRight;
        }

        this.node.setPosition(pos);
    }
}