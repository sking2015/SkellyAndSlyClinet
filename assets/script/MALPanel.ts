import { _decorator, Component, Node } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';

const { ccclass, property } = _decorator;

@ccclass('CMALPanel')
export class CMALPanel extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    Show(bShow: boolean) {
        this.node.active = bShow;
    }

    OnClickClose() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
        this.Show(false);
    }
}


