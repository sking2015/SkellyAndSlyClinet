import { CkeyValuePair } from '../KeyValuePair';
import { _decorator, Component, Node, Animation, error, warn, math, Prefab } from 'cc';
import { eCharPlace } from '../BaseDef';
import { fadeInOut } from '../common/common';
const { ccclass, property } = _decorator;

export const AI_INTERVAL = 0.1; // AI 0.1秒驱动一次

const ACT_STAND = 'stand';
const ACT_IDLE = 'idle';
const ACT_RUN = 'run';
const ACT_WALK = 'walk';
const ACT_WORK = 'work';
const ACT_LAND = 'land';

@ccclass('CCharacter')
export class CCharacter extends Component {
    @property(CkeyValuePair)
    actionList: CkeyValuePair[] = [];

    private _animation: Animation | null = null;
    protected _currentActionKey: string = '';
    private _currentTimer: number = 0;       // 当前动作已持续时间
    private _targetDuration: number = 0;    // 当前动作目标持续时间（含波动）
    private _moveDirection: number = 1;     // 1 为右，-1 为左

    @property
    runSpeed: number = 100;

    @property
    limitLeft: number = -250;
    @property
    limitRight: number = 250;

    //角色动画节点
    nodeChar: Node = null;

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

    //全局唯一索引，方便定位查找
    _index: number = -1;

    set index(i: number) {
        this._index = i;
    }

    get index(): number {
        return this._index;
    }

    //释放自己
    Release() {
        this.index = -1;
        this.node.destroy();
        this.node = null;
    }

    protected onLoad(): void {
        console.log("CCharacter onLoad", this.node.name);

        this.nodeChar = this.node.getChildByName('char');
        if (!this.nodeChar) {
            console.error("can't find node char for character", this.node.name);
        }

        this.nodeGray = this.node.getChildByName('gray');

        this.nodeEffect = this.node.getChildByName('effect')

        this.nodeGray.active = false;

        this.nodeEffect.active = false;

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
            aniEffect.on(Animation.EventType.FINISHED, () => {
                this.nodeEffect.active = false;
            }, this, true)

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

            this._moveDirection = this._returnTargetX > currentX ? 1 : -1;
            console.log(`[CCharacter] 外部刷新开启回归。目标点: ${this._returnTargetX.toFixed(1)}`);
        } else {
            this.switchRandomAction();
        }
    }

    /** 播放指定动画 */
    play(ani: string) {
        if (this.bStone) return;

        if (this._animation && this._animation.getState(ani)) {
            console.log("播放动画", ani);
            this._animation.play(ani);
            this._currentActionKey = ani;

            //除了站立动作外,需要响应播放完毕返回stand
            if (ani != ACT_STAND) {
                this._animation.on(Animation.EventType.FINISHED, () => {
                    this.play(ACT_STAND);
                }, this, true)
            }
        }
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
                this._moveDirection = Math.random() > 0.5 ? 1 : -1;
            }
        } else {
            this.play(nextActionKey);
        }

        //console.log(`[AI 决策] 抽中动作: ${nextActionKey}，计划持续: ${this._targetDuration.toFixed(1)}s。当前权重快照 ->`, Object.fromEntries(this._currentWeights));
    }

    aiBoostTime = 0;
    update(deltaTime: number) {
        if (this.bStone) return;

        this.aiBoostTime += deltaTime;
        if (this.aiBoostTime > AI_INTERVAL) {
            this.AITick();
            this.aiBoostTime = 0;
        }

        //如果在展台，不执行后面的行走
        if (this.ePlace == eCharPlace.ecpShow) {
            return;
        }

        if (this._isReturningToRange) {
            this.handleReturnMovement(deltaTime);
        } else if (this._currentActionKey === ACT_RUN || this._currentActionKey == ACT_WALK) {
            this.handleRunningMovement(deltaTime);
        }
    }

    /** 处理回归安全区间的位移 */
    private handleReturnMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        if (this._currentActionKey == ACT_WALK) {
            speed *= 0.5;
        }

        pos.x += speed * this._moveDirection * dt;

        let isArrived = false;
        if (this._moveDirection === 1 && pos.x >= this._returnTargetX) {
            isArrived = true;
        } else if (this._moveDirection === -1 && pos.x <= this._returnTargetX) {
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
            let scale = this.node.scale.clone();
            scale.x = Math.abs(scale.x) * this._moveDirection;
            this.node.setScale(scale);
        }
    }

    /** 处理日常跑动位移与碰撞边界翻转 */
    private handleRunningMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        if (this._currentActionKey == ACT_WALK) {
            speed *= 0.5;
        }

        pos.x += speed * this._moveDirection * dt;

        if (pos.x >= this.limitRight) {
            pos.x = this.limitRight;
            this._moveDirection = -1;
        } else if (pos.x <= this.limitLeft) {
            pos.x = this.limitLeft;
            this._moveDirection = 1;
        }

        this.node.setPosition(pos);

        let scale = this.node.scale.clone();
        scale.x = Math.abs(scale.x) * this._moveDirection;
        this.node.setScale(scale);
    }
}