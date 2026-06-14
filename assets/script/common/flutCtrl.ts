import { _decorator, Component, Sprite, Material } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FluxLightController')
export class FluxLightController extends Component {

    @property({ type: Sprite })
    public sprite: Sprite = null!;

    @property
    public duration: number = 2.0; // 单词扫过的时间（秒）

    private _material: Material | null = null;
    private _timer: number = 0;
    private _isLooping: boolean = true;

    start() {
        if (this.sprite) {
            // 获取材质实例（确保不影响其他共享该材质的物体）
            this._material = this.sprite.getMaterialInstance(0);
        }
    }

    update(dt: number) {
        if (!this._material) return;

        this._timer += dt;
        if (this._timer > this.duration) {
            if (this._isLooping) {
                this._timer = 0; // 循环播放
            } else {
                return;
            }
        }

        // 将时间映射到进度 (-0.5 到 1.5)
        let progress = (this._timer / this.duration) * 2.0 - 0.5;

        // 传递给 Shader 里的 lightCenter 变量
        this._material.setProperty('lightCenter', progress);
    }
}