import { CkeyValuePair } from './KeyValuePair';
import { _decorator, Component, Node, Animation, error, warn, math, tween } from 'cc';
const { ccclass, property } = _decorator;

const AI_INTERVAL = 0.1; // AI 0.1秒驱动一次

@ccclass('CCharactor')
export class CCharactor extends Component {
    @property(CkeyValuePair)
    actionList: CkeyValuePair[] = [];

    private _animation: Animation | null = null;
    private _currentActionKey: string = '';
    private _currentTimer: number = 0;       // 当前动作已持续时间
    private _targetDuration: number = 0;    // 当前动作目标持续时间（含波动）
    private _moveDirection: number = 1;     // 1 为右，-1 为左

    @property
    runSpeed: number = 100;

    @property
    limitLeft: number = -250;
    @property
    limitRight: number = 250;

    nodeChar: Node = null;

    // ====== 范围外回归专属变量 ======
    private _isReturningToRange: boolean = false; // 是否正在回归范围内
    private _returnTargetX: number = 0;           // 回归的目标X坐标

    protected onLoad(): void {
        console.log("CCharactor onLoad", this.node.name);

        this.nodeChar = this.node.getChildByName('char');
        if (!this.nodeChar) {
            console.error("can't find node char for charactor", this.node.name);
        }

        // 查找动画组件放在onLoad
        this._animation = this.nodeChar.getComponent(Animation);
        if (!this._animation) {
            error(`[CCharactor] 节点 ${this.node.name} 上未找到 Animation 组件！`);
            return;
        }
    }

    start() {
        console.log("CCharactor start", this.node.name);

        // 校验 actionList
        this.actionList.forEach(item => {
            const key = item.key;

            // 优化校验：如果是移动动作，只要 run 和 walk 有一个存在即可
            if (key === 'run' || key === 'walk') {
                if (!this._animation!.getState('run') && !this._animation!.getState('walk')) {
                    error(`[CCharactor] 动作列表中包含移动行为 "${key}"，但在 Animation 中既找不到 "run" 也找不到 "walk"！`);
                }
            } else {
                // 普通非移动动作，必须严格存在
                if (!this._animation!.getState(key)) {
                    error(`[CCharactor] 动作列表中定义的 "${key}" 在 Animation 组件中找不到！`);
                }
            }

            // 检查持续时间
            let baseDuration = parseFloat(item.value);
            if (isNaN(baseDuration) || baseDuration < 2) {
                warn(`[CCharactor] "${key}" 的持续时间低于2秒或无效，已重置为2秒。`);
                item.value = "2";
            }
        });

        // 检查初始位置是否在活动范围外
        this.checkInitialPosition();
    }

    /** * [核心优化] 播放移动动画的统一调度方法
     * @param preferRun 是否优先播放“跑”动画。
     * - true: 优先播放 run，无 run 则降级播放 walk。
     * - false: 优先播放 walk，无 walk 则降级播放 run。
     * @returns 返回实际成功播放的动画 key ('run' 或 'walk')，失败返回空字符串。
     */
    private playMoveAnimation(preferRun: boolean): string {
        if (!this._animation) return '';

        // 根据优先级决定第一选择和第二选择
        const firstChoice = preferRun ? 'run' : 'walk';
        const secondChoice = preferRun ? 'walk' : 'run';

        if (this._animation.getState(firstChoice)) {
            this.play(firstChoice);
            return firstChoice;
        } else if (this._animation.getState(secondChoice)) {
            this.play(secondChoice);
            return secondChoice;
        } else {
            error(`[CCharactor] 节点 ${this.node.name} 尝试移动，但 Animation 中既没有 "run" 也没有 "walk"！`);
            this._currentActionKey = '';
            return '';
        }
    }

    /** 检查位置并决定是否开启回归模式 */
    private checkInitialPosition() {
        const currentX = this.node.position.x;

        // 判断是否在设定的界限以外
        if (currentX < this.limitLeft || currentX > this.limitRight) {
            this._isReturningToRange = true;

            const padding = 10;
            let minX = this.limitLeft + padding;
            let maxX = this.limitRight - padding;

            // 判断正负号，锁定随机目标点在同侧半区，防止长途横穿
            if (currentX > 0) {
                minX = 0;
            } else {
                maxX = 0;
            }

            // 在限定的半区安全范围内随机取一个目标点
            this._returnTargetX = minX + Math.random() * (maxX - minX);

            // [此处已微调] 从场景外刷新，迫切回场：优先使用“跑(run)”动画
            const moveAction = this.playMoveAnimation(true);
            if (!moveAction) {
                // 如果完全没有移动动画，关闭回归状态，防止状态卡死
                this._isReturningToRange = false;
                return;
            }

            // 根据目标点计算初始移动方向
            this._moveDirection = this._returnTargetX > currentX ? 1 : -1;

            console.log(`[CCharactor] 外部刷新(${currentX.toFixed(1)})开启回归。优先跑(preferRun: true)，实际播放: ${moveAction}`);
        } else {
            // 如果本来就在范围内，直接执行原有的随机行为
            this.switchRandomAction();
        }
    }

    /** 播放指定动画 */
    play(ani: string) {
        if (this._animation && this._animation.getState(ani)) {
            this._animation.play(ani);
            this._currentActionKey = ani;
        }
    }

    playLand() {
        console.log("playLand~~!!", this._animation);
        if (this._animation) {
            console.log("playLand~~111111!!");
            const ani = "land";
            this._currentActionKey = ani;
            const landState = this._animation.getState(ani);

            if (landState) {
                landState.on(Animation.EventType.FINISHED, () => {
                    console.log('精准监听：落地动画播放完毕！');
                    console.log("当前节点位置", this.node.position);
                    this._currentActionKey = "";
                }, this);
            }

            console.log("playLand~~2222222222!!");
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

    /** AI 逻辑切换核心 */
    AITick() {
        // 如果处于回归状态，原有的随机行为计时和切换不执行
        if (this._isReturningToRange) return;

        this._currentTimer += AI_INTERVAL;

        // 如果达到目标时间，切换下一个随机动作
        if (this._currentTimer >= this._targetDuration) {
            this.switchRandomAction();
        }
    }

    /** 随机选择下一个动作 */
    private switchRandomAction() {
        if (this.actionList.length === 0) return;

        // 下落中不切换
        if (this._currentActionKey == 'land') return;

        // 随机抽取一个动作定义
        const randomIndex = Math.floor(Math.random() * this.actionList.length);
        const nextAction = this.actionList[randomIndex];

        // 计算带波动的时间 (正负30%)
        const baseTime = parseFloat(nextAction.value);
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
        this._targetDuration = baseTime * randomFactor;
        this._currentTimer = 0;

        const key = nextAction.key;

        // [此处已微调] 日常状态切换
        if (key === 'run' || key === 'walk') {
            // 日常表现属于休闲状态：优先使用“走(walk)”动画
            const moveAction = this.playMoveAnimation(false);
            if (moveAction) {
                // 成功播放了移动动画后，随机决定一个初始方向
                this._moveDirection = Math.random() > 0.5 ? 1 : -1;
            }
        } else {
            // 非移动动画（如 stand, work），按原样直接播放
            this.play(key);
        }
    }

    aiBoostTime = 0;
    update(deltaTime: number) {
        // AI 驱动计时
        this.aiBoostTime += deltaTime;
        if (this.aiBoostTime > AI_INTERVAL) {
            this.AITick();
            this.aiBoostTime = 0;
        }

        // 根据状态分流位移控制
        if (this._isReturningToRange) {
            // 回归状态下的特殊位移
            this.handleReturnMovement(deltaTime);
        } else if (this._currentActionKey === 'run' || this._currentActionKey == 'walk') {
            // 原本的正常范围内随机跑动/行走位移
            this.handleRunningMovement(deltaTime);
        }
    }

    /** 处理回归安全区间的位移，到达目标点后解除状态并恢复日常AI */
    private handleReturnMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        // 自动适配速度：如果最终降级走，速度减半；若是跑，全速前进
        if (this._currentActionKey == 'walk') {
            speed *= 0.5;
        }

        // 向目标点移动
        pos.x += speed * this._moveDirection * dt;

        // 检查是否到达或超过了目标点 X
        let isArrived = false;
        if (this._moveDirection === 1 && pos.x >= this._returnTargetX) {
            isArrived = true;
        } else if (this._moveDirection === -1 && pos.x <= this._returnTargetX) {
            isArrived = true;
        }

        if (isArrived) {
            // 精准对齐目标点
            pos.x = this._returnTargetX;
            this.node.setPosition(pos);

            // 解除回归状态
            this._isReturningToRange = false;
            console.log("[CCharactor] 角色已跑回安全区，开始日常休闲行为模式。");

            // 立刻开始原本正常的随机行为逻辑
            this.switchRandomAction();
        } else {
            this.node.setPosition(pos);

            // 处理镜像翻转
            let scale = this.node.scale.clone();
            scale.x = Math.abs(scale.x) * this._moveDirection;
            this.node.setScale(scale);
        }
    }

    /** 处理跑动位移与碰撞边界翻转 */
    private handleRunningMovement(dt: number) {
        let pos = this.node.position.clone();
        let speed = this.runSpeed;

        if (this._currentActionKey == 'walk') {
            speed *= 0.5;
        }

        // 计算新位置
        pos.x += speed * this._moveDirection * dt;

        // 边界检查：如果超过范围，反转方向
        if (pos.x >= this.limitRight) {
            pos.x = this.limitRight;
            this._moveDirection = -1;
        } else if (pos.x <= this.limitLeft) {
            pos.x = this.limitLeft;
            this._moveDirection = 1;
        }

        this.node.setPosition(pos);

        // 处理翻转 (假设默认面向右)
        let scale = this.node.scale.clone();
        scale.x = Math.abs(scale.x) * this._moveDirection;
        this.node.setScale(scale);
    }
}