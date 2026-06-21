import { _decorator, Component, Label, Node, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CPopInfo')
export class CPopInfo extends Component {

    @property({ type: Label, tooltip: "显示信息" })
    text: Label = null;

    _animation: Animation = null;

    start() {
        this._animation = this.node.getComponent(Animation);
        this._animation.once(Animation.EventType.FINISHED, () => {
            this.node.removeFromParent();
        })
    }

    setText(text: string) {
        this.text.string = text;
    }

    update(deltaTime: number) {

    }
}


