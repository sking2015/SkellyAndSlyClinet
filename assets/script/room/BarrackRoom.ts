import { _decorator, Component, Node } from 'cc';
import { CCheckGroup } from '../common/checkGroup';
import { CBaseRoom } from './BaseRoom';

const { ccclass, property } = _decorator;

@ccclass('CBarrackRoom')
export class CBarrackRoom extends CBaseRoom {

    @property(CCheckGroup)
    checkGroup: CCheckGroup | null = null;

    start() {
        super.start();
        this.refreshRoomShow();
    }

    // update(deltaTime: number) {

    // }

    onClickTroopBtn(event: Event, customEventData: string) {
        console.log("onClickTroopClassBtn", customEventData);
        let nIndex = parseInt(customEventData) - 1;
        this.checkGroup?.setCheckBoxState(nIndex);
    }
}


