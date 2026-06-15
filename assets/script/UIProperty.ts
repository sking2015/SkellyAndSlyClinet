import { _decorator, Component, Label, Node, ProgressBar, Sprite, SpriteFrame } from 'cc';
import { eProperty } from './BaseDef';
import { formatCompactNumber } from './common/common';
import { CProperty2Spriteframe } from './KeyValuePair';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('CUIProperty')
@executeInEditMode
export class CUIProperty extends Component {
    @property({ type: Label, tooltip: "抬头标签" })
    lblTitle: Label = null;

    @property({ type: Label, tooltip: "属性值" })
    lblValue: Label = null;

    @property({ type: ProgressBar, tooltip: "进度条" })
    pb: ProgressBar = null;

    @property({ type: Sprite, tooltip: "进度条图块" })
    sprBar: Sprite = null;

    @property({ type: eProperty, tooltip: "属性类型" })
    _ePro: eProperty = eProperty.eProNone;

    @property({ type: CProperty2Spriteframe, tooltip: "所有属性进度条图块定义" })
    propertyBarCfg: CProperty2Spriteframe[] = [];


    @property({ type: eProperty, tooltip: "设置属性类型" })
    set ePro(e: eProperty) {
        this._ePro = e;
        this.updateFrame();
    }

    get ePro(): eProperty {
        return this._ePro;
    }


    maxValue: number = 0;
    curValue: number = 0;

    private refreshPropertyBarSF() {
        for (let i = 0; i < this.propertyBarCfg.length; ++i) {
            if (this.ePro == this.propertyBarCfg[i].key) {
                this.sprBar.spriteFrame = this.propertyBarCfg[i].value;
            }
        }
    }

    updateFrame() {
        this.lblTitle.string = this.ePro.toString() + ":";
        this.refreshPropertyBarSF();

    }

    setTitle(title: string) {
        this.lblTitle.string = title;
    }

    setMaxValue(max: number) {
        this.maxValue = max;
    }

    setCurValue(v: number) {
        this.curValue = v;
    }

    start() {
    }

    refreshShow() {
        if (this.maxValue == 0) {
            console.error("set value for propertybar without set max value");
        }
        const p = this.curValue / this.maxValue;
        this.pb.progress = p;

        this.lblValue.string = formatCompactNumber(this.curValue);
    }

    update(deltaTime: number) {

    }
}


