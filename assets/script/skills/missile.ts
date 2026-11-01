import { _decorator, Component, Node, tween, Animation, Vec3, math, misc, UITransform, ParticleSystem2D, isValid } from 'cc';
import { CBattleRole } from '../character/battlerole';
import { CCharactersManager } from '../CharacaterMannager';
import type { ISkillEffectData } from './skillbase';
const { ccclass, property } = _decorator;

@ccclass('CMissile')
export class CMissile extends Component {

    @property({ tooltip: "飞行物的速度" })
    speed: number = 600;

    //飞行动画，如果有配置需要在飞行期间播放飞行动画
    @property({ type: Node, tooltip: "飞行动画节点，如果动画需要配置自动加载播放，需要在到达目标点后删除隐藏" })
    nodeFly: Node = null;

    @property({ type: ParticleSystem2D, tooltip: "飞行时的粒子特效" })
    p2dFly: ParticleSystem2D = null;

    //如果有配置会在飞行到目标位后播放爆炸动画
    @property({ type: Node, tooltip: "爆炸动画节点，如果有配置会在飞行到目标位后播放爆炸动画" })
    nodeExplode: Node = null;


    private _direction: Vec3 = new Vec3(1, 0, 0); // 默认向右飞

    private _isMoving: boolean = false;

    caster: CBattleRole = null;
    private effectData: ISkillEffectData = null;

    bFinishe: boolean = false;
    private finishing = false;

    start() {
        //打开飞行节点，隐藏爆炸节点
        if (this.nodeFly) {
            this.nodeFly.active = true;

            if (this.p2dFly) {
                this.p2dFly.stopSystem(); // 确保初始状态是静止的

                // 延迟到下一帧（等由于加载产生的超大 dt 过去后）再播放
                this.scheduleOnce(() => {
                    this.p2dFly.resetSystem();
                }, 0);
            }
        }

        if (this.nodeExplode) {
            this.nodeExplode.active = false;
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

    setCaster(role: CBattleRole, effect: ISkillEffectData) {
        this.caster = role;
        this.effectData = { ...effect };
    }

    onFinished() {
        if (this.finishing) return;
        this.finishing = true;
        this._isMoving = false;
        if (this.nodeFly) this.nodeFly.active = false;
        this.p2dFly?.stopSystem();
        if (this.p2dFly) {
            //如果有飞行拖尾，两秒后结束，让拖尾表现完
            this.scheduleOnce(() => {
                this.bFinishe = true;
            }, 2)
        } else {
            this.bFinishe = true;
        }
        if (isValid(this.caster)) this.caster.onMissileFinished();
    }

    doExplode() {
        tween(this.nodeFly).to(0.1, { scale: new Vec3(0.1, 0.1, 0.1) }).call(() => {
            this.nodeFly.active = false;
            this.p2dFly?.stopSystem();
            if (this.nodeExplode) {
                this.nodeExplode.active = true;
                const ani = this.nodeExplode.getComponent(Animation);
                if (ani) {
                    ani.play(ani.clips[0].name);
                    ani.once(Animation.EventType.FINISHED, () => {
                        //表现全部完成。。。
                        this.onFinished();
                    })
                } else this.onFinished();
            }

        }).start();
    }

    // ?????????????????????????????????
    private hitTarget(role: CBattleRole) {
        if (!role || !this.caster || !this.effectData || role.getRoom() !== this.caster.getRoom()) return;

        // 判断字弹是还在移动，是否不同阵营，当然，以后如果是子弹加血，就反过来
        if (this._isMoving && role.getBattleCamp() != this.caster.getBattleCamp() && role.IsAlive() && role.getInBattle()) {
            // 先停止命中判定，避免同一物理帧中的多个碰撞重复伤害/结算。
            this._isMoving = false;
            if (this.nodeExplode) {
                this.doExplode();
            } else {
                //没有爆炸效果的可以直接完成稍后删除了
                // console.log("命中~！");
                this.onFinished();
            }

            role.onHitedReady(this.caster);
            role.onHited(this.caster, this.effectData);

        }
    }

    update(deltaTime: number) {
        if (this._isMoving) {
            // 每帧沿着方向向量移动：当前坐标 + 方向 * 速度 * 时间
            let currentPos = this.node.position;

            let moveX = currentPos.x + this._direction.x * this.speed * deltaTime;
            let moveY = currentPos.y + this._direction.y * this.speed * deltaTime;

            const layer = this.caster.getRoom().nodeCharLayer.getComponent(UITransform);
            const parent = this.node.parent.getComponent(UITransform);
            const toBattleX = (p: Vec3) => layer.convertToNodeSpaceAR(parent.convertToWorldSpaceAR(p)).x;
            const startX = toBattleX(currentPos);
            const endX = toBattleX(new Vec3(moveX, moveY, currentPos.z));
            const blocker = CCharactersManager.instance.getFirstEnemyOnPath(this.caster, startX, endX);
            if (blocker) {
                const direction = endX >= startX ? 1 : -1;
                const contactX = blocker.getPosition() - direction * blocker.getRoleHalfWidth();
                const t = Math.abs(endX - startX) < 0.001 ? 0
                    : Math.max(0, Math.min(1, (contactX - startX) / (endX - startX)));
                this.node.setPosition(currentPos.x + (moveX - currentPos.x) * t,
                    currentPos.y + (moveY - currentPos.y) * t, currentPos.z);
                this.hitTarget(blocker as CBattleRole);
                return;
            }
            this.node.setPosition(moveX, moveY, currentPos.z);

            // 飞出太远自动销毁
            if (Math.abs(this.node.position.x) > 1000 || Math.abs(this.node.position.y) > 500) {
                this.onFinished();
            }
        }


        if (this.bFinishe) {
            // console.log("生命周期完成~!删除子弹")
            this.node.destroy();
        }
    }
}


