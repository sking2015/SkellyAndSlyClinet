import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CCheckBox')
export class CCheckBox extends Component {

    @property(Node)
    checkBoxNode: Node | null = null;

    start() {

    }

    update(deltaTime: number) {

    }

    setCheckBoxState(isChecked: boolean) {
        if (this.checkBoxNode) {
            this.checkBoxNode.active = isChecked;
        }
    }
}


