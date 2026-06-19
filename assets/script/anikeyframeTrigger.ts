import { _decorator, Component, Node } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';

const { ccclass, property } = _decorator;

//动画关键帧触发器，用于触发动画关键帧
@ccclass('CAnikeyframeTrigger')
export class CAnikeyframeTrigger extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    onKeyFrame(sPara: string) {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_ani_key, true, { para: sPara }));
    }
}


