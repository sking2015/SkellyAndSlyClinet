import { _decorator, Component, Node } from 'cc';
import { CCheckBox } from './checkBox';

const { ccclass, property } = _decorator;

//定义一个单选组组件，里面包含多个checkBox组件，保证同一时间只有一个checkBox被选中
@ccclass('CCheckGroup')
export class CCheckGroup extends Component {
    @property([CCheckBox])
    checkBoxList: CCheckBox[] = [];

    start() {
        this.setCheckBoxState(0); //默认选中第一个
    }

    update(deltaTime: number) {

    }

    setCheckBoxState(index: number) {
        for (let i = 0; i < this.checkBoxList.length; i++) {
            if (i === index) {
                this.checkBoxList[i].setCheckBoxState(true);
            } else {
                this.checkBoxList[i].setCheckBoxState(false);
            }
        }
    }
}


