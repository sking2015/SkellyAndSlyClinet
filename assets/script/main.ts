import { _decorator, Component, Node, ScrollView } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    @property(ScrollView)
    roomSV: ScrollView = null;
    start() {

    }

    update(deltaTime: number) {

    }
}


