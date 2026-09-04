import { _decorator, Component, Node, EventTouch, tween, Sprite, Label } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { fadeInOut } from '../common/common';
import { CTroopInfo } from '../TroopInfo';
import { CLordInfo } from '../LordInfo';
import { eCCharacterID } from '../BaseDef';
import { CGlobalData } from '../GlobalData';

const { ccclass, property } = _decorator;

const COMBAT_PANEL_Y_EXPANDED = 24; // 扩展面板展开时的 Y 坐标
const COMBAT_PANEL_Y_COLLAPSED = 88; // 扩展面板收起时的 Y 坐标

@ccclass('CBattleRoom')
export class CBattleRoom extends CBaseRoom {

    @property({ type: Node, tooltip: "房间左上角战力显示面板" })
    nodeCombatDataPanel: Node = null;

    @property({ type: Label, tooltip: "部署部队总量" })
    lblTotalTroops: Label = null;

    @property({ type: CLordInfo, tooltip: "房间领主信息" })
    lordInfo: CLordInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（战士）" })
    troopInfoSoldier: CTroopInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（弓箭手）" })
    troopInfoArcher: CTroopInfo = null;

    @property({ type: CTroopInfo, tooltip: "房间守卫信息（法师）" })
    troopInfoMage: CTroopInfo = null;



    nTroopsCapacity: number = 15; // 部队容量,先写死15,以后再上影响值

    eGuardId: eCCharacterID = eCCharacterID.eciNone;
    nSoldierNum: number = 0;
    nArcherNum: number = 0;
    nMageNum: number = 0;

    start() {
        super.start();
        this.nodeCombatDataPanel.active = false;

        this.refreshRoomShow();
    }


    refreshExpand() {
        this.eGuardId = CGlobalData.instance.getRoomGuardIdByIndex(this.index);
        console.log("刷新房间扩展面板显示，房间索引", this.index, "守卫角色ID", this.eGuardId);

        this.nSoldierNum = CGlobalData.instance.getRoomSoldierNumByIndex(this.index);
        this.nArcherNum = CGlobalData.instance.getRoomArcherNumByIndex(this.index);
        this.nMageNum = CGlobalData.instance.getRoomMageNumByIndex(this.index);


        //模拟一下血量，后续可以根据兵营里的兵种信息获取真实的血量
        let nSoldierHp = 200;
        let nArcherHp = 100;
        let nMageHp = 100;

        //刷新房间的战力显示
        this.lordInfo.setCharID(this.eGuardId);
        this.troopInfoSoldier.setCount(this.nSoldierNum);
        this.troopInfoArcher.setCount(this.nArcherNum);
        this.troopInfoMage.setCount(this.nMageNum);

        this.lblTotalTroops.string = (this.nSoldierNum + this.nArcherNum + this.nMageNum).toString() + "/" + this.nTroopsCapacity.toString();

        this.troopInfoSoldier.setHealth(nSoldierHp * this.nSoldierNum);
        this.troopInfoArcher.setHealth(nArcherHp * this.nArcherNum);
        this.troopInfoMage.setHealth(nMageHp * this.nMageNum);
    }


    refreshRoomShow() {
        super.refreshRoomShow();
        console.log("以后这里应该要放刷新守卫显示的内容");
    }

    onClickLord() {
        console.log("点击了房间的领主按钮");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_chars_list, true, {
            roomIndex: this.index, callback: (charId: eCCharacterID) => {
                console.log("选择了领主角色", charId);
                this.eGuardId = charId;
                CGlobalData.instance.setRoomGuardIdByIndex(this.index, charId);
                this.refreshExpand();

                this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
            }
        }));
    }

    onClickTroop(event: EventTouch, customEventData: string) {
        console.log("点击了房间的小兵按钮", customEventData);

        // this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_panel, true, { roomType: this.roomType, roomIndex: this.index }));
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_troop, true, { troopIndex: customEventData, roomIndex: this.index }));
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


