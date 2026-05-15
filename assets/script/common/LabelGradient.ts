import { _decorator, Component, Color, Label, Node } from 'cc';
const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

@ccclass('LabelGradient')
@executeInEditMode
@requireComponent(Label)
export class LabelGradient extends Component {

    @property({ tooltip: '顶部颜色' })
    get topColor() { return this._topColor; }
    set topColor(val) { this._topColor = val; this._updateColors(); }

    @property({ tooltip: '底部颜色' })
    get bottomColor() { return this._bottomColor; }
    set bottomColor(val) { this._bottomColor = val; this._updateColors(); }

    @property({ serializable: true })
    private _topColor: Color = Color.WHITE.clone();
    @property({ serializable: true })
    private _bottomColor: Color = Color.WHITE.clone();

    private _label: Label | null = null;
    private _lastString: string = "";

    onLoad() {
        this._label = this.getComponent(Label);
    }

    onEnable() {
        // 监听节点尺寸变化
        this.node.on(Node.EventType.SIZE_CHANGED, this._updateColors, this);
        this._updateColors();
    }

    onDisable() {
        this.node.off(Node.EventType.SIZE_CHANGED, this._updateColors, this);
    }

    /**
     * 每一帧检查文本是否改变，改变了就刷颜色
     */
    lateUpdate() {
        if (this._label && this._label.string !== this._lastString) {
            this._lastString = this._label.string;
            this._updateColors();
        }
    }

    private _updateColors() {
        const label = this._label || this.getComponent(Label);
        if (!label) return;

        // 【关键改动】使用公开的 API 强制更新渲染数据
        label.updateRenderData(true);

        const renderData = label.renderData;
        if (!renderData) return;

        const vertexCount = renderData.vertexCount;
        if (vertexCount === 0) return;

        const vb = renderData.chunk.vb;
        const floatsPerVert = renderData.floatStride;

        for (let i = 0; i < vertexCount; i++) {
            const offset = i * floatsPerVert + 5;

            // 顶点索引规律：0,1 为底，2,3 为顶
            const vIdxInQuad = i % 4;
            const isTop = (vIdxInQuad === 2 || vIdxInQuad === 3);
            const targetColor = isTop ? this._topColor : this._bottomColor;

            vb[offset] = targetColor.r / 255;
            vb[offset + 1] = targetColor.g / 255;
            vb[offset + 2] = targetColor.b / 255;
            vb[offset + 3] = targetColor.a / 255;
        }

        // 通知渲染器数据已更新
        renderData.vertDirty = true;
    }
}