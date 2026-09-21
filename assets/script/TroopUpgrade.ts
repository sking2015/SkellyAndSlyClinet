import { _decorator, Component, Node } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
const { ccclass, property } = _decorator;

@ccclass('CTroopUpgrade')
export class CTroopUpgrade extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    Show(bShow: boolean) {
        this.node.active = bShow;

        if (!bShow) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
        }
    }

    onClickClose() {
        this.Show(false);
    }
}


