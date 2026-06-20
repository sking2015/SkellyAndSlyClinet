import { _decorator, Component, Node, tween, Animation, Vec3, math, misc, Collider2D, IPhysics2DContact, Contact2DType } from 'cc';
import { CBattleRole } from '../character/battlerole';
const { ccclass, property } = _decorator;

@ccclass('CMissile')
export class CMissile extends Component {

    //飞行动画，如果有配置需要在飞行期间播放飞行动画
    @property({ type: Node, tooltip: "飞行动画节点，如果朋动画需要配置自动加载播放，需要在到达目标点后删除隐藏" })
    nodeFly: Node = null;

    //如果有配置会在飞行到目标位后播放爆炸动画
    @property({ type: Node, tooltip: "爆炸动画节点，如果有配置会在飞行到目标位后播放爆炸动画" })
    nodeExplode: Node = null;


    private _direction: Vec3 = new Vec3(1, 0, 0); // 默认向右飞

    private _isMoving: boolean = false;

    public speed: number = 600;

    caster: CBattleRole = null;

    bFinishe: boolean = false;

    start() {
        //打开飞行节点，隐藏爆炸节点
        this.nodeFly.active = true;
        if (this.nodeExplode) {
            this.nodeExplode.active = false;
        }

        // 获取子弹上的碰撞组件
        let collider = this.getComponent(Collider2D);
        if (collider) {
            // 监听触发器事件（因为勾选了 IsTrigger）
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    public init(isFaceRight: boolean) {
        // 如果人物朝左（Scale.x < 0），子弹方向反转
        this._direction.x = isFaceRight ? 1 : -1;

        // 让子弹图片本身的朝向也跟着翻转
        let currentScale = this.node.scale.clone();
        currentScale.x = isFaceRight ? Math.abs(currentScale.x) : -Math.abs(currentScale.x);
        this.node.scale = currentScale;

        this._isMoving = true;
    }

    public LauncheWithTarget(startWorldPos: Vec3, targetWorldPos: Vec3) {
        // 1. 计算两点之间的方向向量：方向 = 目标点 - 起始点
        Vec3.subtract(this._direction, targetWorldPos, startWorldPos);

        // 2. 将 Z 轴清零（2D 横版游戏不需要 Z 轴位移）
        this._direction.z = 0;

        // 3. 归一化向量（使其长度为 1，确保子弹在任何角度都保持恒定的速度）
        this._direction.normalize();

        // 4. 【让子弹图片朝向目标】计算旋转角度（从右侧(1,0)逆时针旋转到目标方向的角度）
        // Math.atan2 算出弧度，再乘以 math.RAD_TO_DEG 转为角度
        // 计算弧度
        let radian = Math.atan2(this._direction.y, this._direction.x);

        // 使用 misc.radiansToDegrees 将弧度转为角度
        let angle = misc.radiansToDegrees(radian);

        this.node.setRotationFromEuler(0, 0, angle);

        this._isMoving = true;
    }

    setCaster(role: CBattleRole) {
        this.caster = role;
    }

    doExplode() {
        tween(this.nodeFly).to(0.1, { scale: new Vec3(0.1, 0.1, 0.1) }).call(() => {
            this.nodeFly.active = false;
            if (this.nodeExplode) {
                this.nodeExplode.active = true;
                const ani = this.nodeExplode.getComponent(Animation);
                if (ani) {
                    ani.play(ani.clips[0].name);
                    ani.on(Animation.EventType.FINISHED, () => {
                        //表现全部完成。。。
                        this.bFinishe = true;
                    })
                }
            }

        }).start();
    }

    /**
     * 当子弹碰到任何配置了碰撞体的物体时触发
     */
    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 获取被击中节点的标签或名字，或者获取其身上的组件
        // console.log("开始碰撞~!!");

        let otherNode = otherCollider.node;
        const role: CBattleRole = otherNode.getComponent(CBattleRole);

        // 判断是否不同敌人，当然，以后如果是子弹加血，就反过来
        if (role.getBattleCamp() != this.caster.getBattleCamp()) {
            this.doExplode();

            role.onHitedReady(this.caster);
            role.onHited();

            this._isMoving = false;
        }
    }

    // 别忘了在节点销毁时注销事件，防止内存泄漏
    onDestroy() {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    // Launche(tar: CBattleRole) {
    //     tween(this.node).to(0.8, { position: tar.node.position }).call(() => {
    //         tween(this.nodeFly).to(0.3, { scale: new Vec3(0.1, 0.1, 0.1) }).call(() => {
    //             this.nodeFly.active = false;
    //             if (this.nodeExplode) {
    //                 this.nodeFly.active = true;
    //                 const ani = this.nodeExplode.getComponent(Animation);
    //                 if (ani) {
    //                     ani.play(ani.clips[0].name);
    //                     ani.on(Animation.EventType.FINISHED, () => {
    //                         //表现全部完成。。。
    //                         this.bFinishe = true;
    //                     })
    //                 }
    //             }

    //         }).start();
    //     }).start();
    // }

    update(deltaTime: number) {
        if (!this._isMoving) return;

        // 每帧沿着方向向量移动：当前坐标 + 方向 * 速度 * 时间
        let currentPos = this.node.position;

        let moveX = currentPos.x + this._direction.x * this.speed * deltaTime;
        let moveY = currentPos.y + this._direction.y * this.speed * deltaTime;

        this.node.setPosition(moveX, moveY, currentPos.z);

        // 飞出太远自动销毁
        if (Math.abs(this.node.position.x) > 1000 || Math.abs(this.node.position.y) > 500) {
            this.node.destroy();
        }

        if (this.bFinishe) {
            this.node.destroy();
        }
    }
}


