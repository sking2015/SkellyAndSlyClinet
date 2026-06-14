import { _decorator, Component, Sprite, Material } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FluxLightController')
export class FluxLightController extends Component {

    @property({ type: Sprite, tooltip: '需要加流光的Sprite组件' })
    public sprite: Sprite = null!;

    @property({ tooltip: '单次流光扫过的时间（秒），数值越大速度越慢' })
    public duration: number = 5.0; // 默认改为 5 秒扫一次，速度会明显变慢

    @property({ tooltip: '每次扫完后，停顿多长时间再开始下一次（秒）' })
    public intervalDelay: number = 1.0; // 新增：扫完后停顿 1 秒，效果更自然

    private _material: Material | null = null;
    private _timer: number = 0;


    start() {
        if (this.sprite) {
            // 获取材质实例（确保不影响其他共享该材质的物体）
            this._material = this.sprite.getMaterialInstance(0);
        }
    }

    update(dt: number) {
        if (!this._material) return;

        this._timer += dt;

        // 总周期为：扫过时间 + 停顿时间
        let totalCycle = this.duration + this.intervalDelay;

        if (this._timer > totalCycle) {
            this._timer = 0; // 循环播放
        }

        // 如果当前时间在扫过的时间段内，计算进度；如果在停顿期间，保持在终点外
        let progress = -0.5;
        if (this._timer <= this.duration) {
            progress = (this._timer / this.duration);
        } else {
            progress = 1.5; // 扫完隐藏
        }

        // 传递给 Shader 里的 lightCenter 变量
        this._material.setProperty('lightCenter', progress);
    }
}