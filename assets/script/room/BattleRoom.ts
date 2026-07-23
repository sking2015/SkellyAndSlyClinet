import { _decorator, Component, Node, EventTouch, tween } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { fadeInOut } from '../common/common';

const { ccclass, property } = _decorator;

const COMBAT_PANEL_Y_EXPANDED = 24; // 扩展面板展开时的 Y 坐标
const COMBAT_PANEL_Y_COLLAPSED = 88; // 扩展面板收起时的 Y 坐标

@ccclass('CBattleRoom')
export class CBattleRoom extends CBaseRoom {

    @property({ type: Node, tooltip: "房间左上角战力显示面板" })
    nodeCombatDataPanel: Node = null;

    start() {
        super.start();
        this.nodeCombatDataPanel.active = false;
    }

    onClickLord() {
        console.log("点击了房间的领主按钮");
    }

    onClickTroop(event: EventTouch, customEventData: string) {
        console.log("点击了房间的小兵按钮", customEventData);
    }

    onClickConfirm() {
        console.log("点击了房间的确认按钮");
    }

    onOpenExpand() {
        super.onOpenExpand();
        console.log("点击展开按钮，展开房间的扩展面板");

        this.nodeCombatDataPanel.active = true;
        fadeInOut(this.nodeCombatDataPanel, 0.3, true, () => {
            tween(this.nodeCombatDataPanel).to(0.3, { y: COMBAT_PANEL_Y_EXPANDED }, { easing: 'backOut' }).start();
        });
    }

    onCloseExpand() {
        super.onCloseExpand();
        console.log("点击关闭按钮，关闭房间的扩展面板");
        tween(this.nodeCombatDataPanel).to(0.3, { y: COMBAT_PANEL_Y_COLLAPSED }, { easing: 'backIn' }).call(() => {
            fadeInOut(this.nodeCombatDataPanel, 0.3, false, () => {
                this.nodeCombatDataPanel.active = false;
            });
        }).start();

    }

}


