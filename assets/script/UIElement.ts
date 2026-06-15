import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CUIElement')
export class CUIElement extends Component {

    @property({ type: Sprite, tooltip: "元素图标" })
    sprIcon: Sprite = null;

    @property({ type: Label, tooltip: "元素的数值" })
    lblValue: Label = null;

    value: number = 0;

    start() {

    }

    setValue(v: number) {
        this.value = v;
        this.rereshShow();
    }

    rereshShow() {
        this.lblValue.string = this.value.toString();
    }

    update(deltaTime: number) {

    }
}


