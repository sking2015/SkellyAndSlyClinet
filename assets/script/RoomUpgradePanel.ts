import { _decorator, Color, color, Component, Label, Node, Sprite } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { IResData, getResDataByRoomTypeAndLevel } from './ConfigInterface';
import { formatCompactNumber } from './common/common';
import { LabelGradient } from './common/LabelGradient';
import { CGlobalData } from './GlobalData';
import { CResManager } from './ResManager';
import { getI18nText } from './i18nLan';

const { ccclass, property } = _decorator;

@ccclass('CRoomUpgradePanel')
export default class CRoomUpgradePanel extends Component {


    @property({ type: Label, tooltip: "当前金币" })
    lblCurCoin: Label = null;
    @property({ type: Label, tooltip: "当前木材" })
    lblCurWood: Label = null;
    @property({ type: Label, tooltip: "当前金属" })
    lblCurMetal: Label = null;

    @property({ type: Label, tooltip: "当前房间资源" })
    lblCurRoomRes: Label = null;

    @property({ type: Label, tooltip: "当前房间等级" })
    lblCurRoomLevel: Label = null;
    @property({ type: Label, tooltip: "下一级房间等级" })
    lblNextRoomLevel: Label = null;

    @property({ type: Sprite, tooltip: "当前房间产出图标" })
    sprResIcon: Sprite = null;
    @property({ type: Label, tooltip: "当前等级产量" })
    lblCurLevelOutput: Label = null;
    @property({ type: Label, tooltip: "下一级产量" })
    lblNextLevelOutput: Label = null;

    @property({ type: Label, tooltip: "当前存储容量" })
    lblCurStorage: Label = null;

    @property({ type: Sprite, tooltip: "当前房间容量图标" })
    sprCapacityIcon: Sprite = null;
    @property({ type: Label, tooltip: "当前等级容量" })
    lblCurLevelCapacity: Label = null;
    @property({ type: Label, tooltip: "下一级容量" })
    lblNextLevelCapacity: Label = null;


    @property({ type: Label, tooltip: "消费金币" })
    lblCostCoin: Label = null;
    @property({ type: LabelGradient, tooltip: "消费金币颜色渐变控件" })
    lblCostCoinGradient: LabelGradient = null;

    @property({ type: Label, tooltip: "消费木材" })
    lblCostWood: Label = null;
    @property({ type: LabelGradient, tooltip: "消费木材颜色渐变控件" })
    lblCostWoodGradient: LabelGradient = null;

    @property({ type: Label, tooltip: "消费金属" })
    lblCostMetal: Label = null;
    @property({ type: LabelGradient, tooltip: "消费金属颜色渐变控件" })
    lblCostMetalGradient: LabelGradient = null;


    @property({ type: LabelGradient, tooltip: "按钮文字颜色渐变控件" })
    lgButtonText: LabelGradient = null;


    @property({ type: Node, tooltip: "背景遮罩节点" })
    nodeMask: Node = null;


    //当前描述房间index
    nCurRoomIndex: number = -1;

    bCoinNotEnough: boolean = false;
    bWoodNotEnough: boolean = false;
    bMetalNotEnough: boolean = false;


    nCostCoin: number = 0;
    nCostWood: number = 0;
    nCostMetal: number = 0;

    start() {
        this.nodeMask.on(Node.EventType.TOUCH_START, this.onClose, this);
    }

    ondestroy() {
        this.nodeMask.off(Node.EventType.TOUCH_START, this.onClose, this);
    }

    refreshPanel() {
        if (this.nCurRoomIndex < 0) {
            console.error("房间升级面板刷新失败，当前房间index非法", this.nCurRoomIndex);
            return;
        }

        const roomData = CGlobalData.instance.getRoomDataByIndex(this.nCurRoomIndex);

        this.lblCurCoin.string = formatCompactNumber(CGlobalData.instance.nCoin);
        this.lblCurWood.string = formatCompactNumber(CGlobalData.instance.nWood);
        this.lblCurMetal.string = formatCompactNumber(CGlobalData.instance.nMetal);


        this.lblCurRoomLevel.string = `${roomData.level}`;
        this.lblNextRoomLevel.string = `${roomData.level + 1}`;

        this.sprResIcon.spriteFrame = CResManager.instance.getRoomResIcon(roomData.eType);

        const resDataCur: IResData = getResDataByRoomTypeAndLevel(roomData.eType, roomData.level);
        const resDataNext: IResData = getResDataByRoomTypeAndLevel(roomData.eType, roomData.level + 1);


        this.lblCurRoomRes.string = resDataCur.ResType;

        this.lblCurLevelOutput.string = formatCompactNumber(resDataCur.ProducePer5Sec * 12 * 60) + "/H";
        this.lblNextLevelOutput.string = formatCompactNumber(resDataNext.ProducePer5Sec * 12 * 60) + "/H";

        this.lblCurStorage.string = formatCompactNumber(roomData.nStock);

        this.sprCapacityIcon.spriteFrame = CResManager.instance.getRoomResCapIcon(roomData.eType);

        this.lblCurLevelCapacity.string = formatCompactNumber(resDataCur.MaxCapacity);
        this.lblNextLevelCapacity.string = formatCompactNumber(resDataNext.MaxCapacity);

        this.lblCostCoin.string = formatCompactNumber(resDataNext.Cost_Gold);
        this.lblCostWood.string = formatCompactNumber(resDataNext.Cost_Metal);
        this.lblCostMetal.string = formatCompactNumber(resDataNext.Cost_Metal);

        this.bCoinNotEnough = CGlobalData.instance.nCoin < resDataNext.Cost_Gold;
        this.bWoodNotEnough = CGlobalData.instance.nWood < resDataNext.Cost_Metal;
        this.bMetalNotEnough = CGlobalData.instance.nMetal < resDataNext.Cost_Metal;

        if (this.bCoinNotEnough) {
            this.lblCostCoinGradient.bottomColor = Color.fromHEX(new Color(), '#FF0000');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#A7A7A7')
        } else {
            this.nCostCoin = resDataNext.Cost_Gold;
            this.lblCostCoinGradient.bottomColor = Color.fromHEX(new Color(), '#F7CAFF');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#DDC200')

        }

        if (this.bWoodNotEnough) {
            this.lblCostWoodGradient.bottomColor = Color.fromHEX(new Color(), '#FF0000');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#A7A7A7')
        } else {
            this.nCostWood = resDataNext.Cost_Metal;
            this.lblCostWoodGradient.bottomColor = Color.fromHEX(new Color(), '#F7CAFF');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#DDC200')
        }

        if (this.bMetalNotEnough) {
            this.lblCostMetalGradient.bottomColor = Color.fromHEX(new Color(), '#FF0000');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#A7A7A7')
        } else {
            this.nCostMetal = resDataNext.Cost_Metal;
            this.lblCostMetalGradient.bottomColor = Color.fromHEX(new Color(), '#F7CAFF');
            this.lgButtonText.bottomColor = Color.fromHEX(new Color(), '#DDC200')
        }
    }

    onOpen() {
        this.node.active = true;
        this.refreshPanel();
    }

    onClose() {
        this.node.active = false;
    }

    setRoomIndex(idx: number) {
        this.nCurRoomIndex = idx;
    }

    onCostRes() {
        console.log("资源消耗前", CGlobalData.instance);
        CGlobalData.instance.nCoin -= this.nCostCoin;
        CGlobalData.instance.nMetal -= this.nCostMetal;
        CGlobalData.instance.nWood -= this.nCostWood;
        console.log("资源消耗后", CGlobalData.instance);
    }

    onClickConfirm() {

        if (this.bCoinNotEnough || this.bWoodNotEnough || this.bMetalNotEnough) {
            //资源不足，无法升级
            let tips = "";
            if (this.bCoinNotEnough) {
                tips = getI18nText("RES_NOT_ENOUGH", "coin");
            } else if (this.bWoodNotEnough) {
                tips += getI18nText("RES_NOT_ENOUGH", "wood");
            } else if (this.bMetalNotEnough) {
                tips += getI18nText("RES_NOT_ENOUGH", "metal");
            }

            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: tips }));
        } else {
            this.onCostRes();
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_room_upgrade, true, { roomIdx: this.nCurRoomIndex }))
            this.onClose();
        }

    }

    update(deltaTime: number) {

    }
}


