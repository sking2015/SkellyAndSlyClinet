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
            // 检查动画是否存在
            if (!this._animation!.getState(item.key)) {
                error(`[CCharactor] 动作列表中定义的 "${item.key}" 在 Animation 组件中找不到！`);
            }
            // 检查持续时间
            let baseDuration = parseFloat(item.value);
            if (isNaN(baseDuration) || baseDuration < 2) {
                warn(`[CCharactor] "${item.key}" 的持续时间低于2秒或无效，已重置为2秒。`);
                item.value = "2";
            }
        });
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
                // 2. 仅在该动画状态上绑定结束事件
                landState.on(Animation.EventType.FINISHED, () => {
                    console.log('精准监听：落地动画播放完毕！');
                    // 这里编写攻击完后的逻辑，比如进入冷却 CD
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
        this._currentTimer += AI_INTERVAL;

        // 如果达到目标时间，切换下一个随机动作
        if (this._currentTimer >= this._targetDuration) {
            this.switchRandomAction();
        }
    }

    /** 随机选择下一个动作 */
    private switchRandomAction() {
        if (this.actionList.length === 0) return;

        //下落中不切换
        if (this._currentActionKey == 'land') return;

        // 随机抽取一个动作定义
        const randomIndex = Math.floor(Math.random() * this.actionList.length);
        const nextAction = this.actionList[randomIndex];

        // 计算带波动的时间 (正负30%)
        const baseTime = parseFloat(nextAction.value);
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
        this._targetDuration = baseTime * randomFactor;
        this._currentTimer = 0;

        // 根据 key 执行对应的逻辑方法
        const key = nextAction.key;
        this.play(key);
        if (key == "run" || key == "walk") {
            // 随机决定一个初始方向
            this._moveDirection = Math.random() > 0.5 ? 1 : -1;
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

        // 如果当前是跑动状态，处理位移
        if (this._currentActionKey === 'run' || this._currentActionKey == 'walk') {
            this.handleRunningMovement(deltaTime);
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
        // 向左走时 scale.x 为负，向右走时为正
        let scale = this.node.scale.clone();
        scale.x = Math.abs(scale.x) * this._moveDirection;
        this.node.setScale(scale);
    }
}