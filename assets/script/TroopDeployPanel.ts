import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { eTroopType } from './BaseDef';
import { CGlobalData } from './GlobalData';
import { CkeyValuePair4Spriteframe } from './KeyValuePair';

const { ccclass, property } = _decorator;

@ccclass('CTroopDeployPanel')
export class CTroopDeployPanel extends Component {

    @property({ type: Label, tooltip: "总部队数量" })
    totalTroopsLabel: Label = null;

    @property({ type: Label, tooltip: "当前房间部署总量" })
    currentRoomTroopsLabel: Label = null;

    @property({ type: Label, tooltip: "当前位置部署数量" })
    currentLocationTroopsLabel: Label = null;

    @property({ type: Label, tooltip: "当前部队部署数量，头像下方" })
    currentLocationTroopsLabel2: Label = null;

    @property({ type: Sprite, tooltip: "部队图标" })
    sprTroop: Sprite = null;

    @property({ type: CkeyValuePair4Spriteframe, tooltip: "部队类型图标" })
    troopTypeSpriteFrame: CkeyValuePair4Spriteframe[] = [];

    //总可用部队数量
    capacityTroops: number = 0;
    //剩余可用部队数量
    leftTroops: number = 0;

    //当前房间可部署部队数量
    roomCapacityTroops: number = 0;
    //当前房间已部署部队数量
    roomCurrentTroops: number = 0;

    //当前位置可部署部队数量
    currentLocationCapacityTroops: number = 0;
    //当前位置已部署部队数量
    currentLocationCurrentTroops: number = 0;





    roomIndex: number = -1;
    troopIndex: eTroopType = eTroopType.ettNone;

    start() {

    }

    update(deltaTime: number) {

    }

    setInfo(roomIndex: number, troopIndex: eTroopType) {
        this.roomIndex = roomIndex;
        this.troopIndex = troopIndex;

        console.log("设置部队部署面板信息,roomIndex=" + roomIndex + ",troopIndex=" + this.troopIndex);

        this.capacityTroops = 50; //总可用部队数量,后续可以从全局数据获取
        this.leftTroops = 50; //剩余可用部队数量,后续可以从全局数据获取

        this.roomCapacityTroops = 15; //当前房间可部署部队数量,后续可以从全局数据获取

        this.roomCurrentTroops = CGlobalData.instance.getTroopTotalNumByIndex(this.roomIndex);

        this.currentLocationCapacityTroops = 5; //当前位置可部署部队数量,后续可以从全局数据获取

        switch (this.troopIndex) {
            case eTroopType.ettSoldier: //近战
                this.currentLocationCurrentTroops = CGlobalData.instance.getRoomSoldierNumByIndex(this.roomIndex);
                this.capacityTroops = CGlobalData.instance.getSoldierCapacity();
                this.leftTroops = CGlobalData.instance.getSoldierLeft();

                break;
            case eTroopType.ettArcher: //远程
                this.currentLocationCurrentTroops = CGlobalData.instance.getRoomArcherNumByIndex(this.roomIndex);
                this.capacityTroops = CGlobalData.instance.getArcherCapacity();
                this.leftTroops = CGlobalData.instance.getArcherLeft();
                break;
            case eTroopType.ettMage: //法师
                this.currentLocationCurrentTroops = CGlobalData.instance.getRoomMageNumByIndex(this.roomIndex);
                this.capacityTroops = CGlobalData.instance.getMageCapacity();
                this.leftTroops = CGlobalData.instance.getMageLeft();
                break;
            default:
                console.log("未知的troopIndex=" + this.troopIndex);
        }

        this.refreshShow();
    }

    getTroopTypeSpriteFrame(troopIndex: number): SpriteFrame {
        for (let i = 0; i < this.troopTypeSpriteFrame.length; i++) {
            if (this.troopTypeSpriteFrame[i].key == troopIndex.toString()) {
                return this.troopTypeSpriteFrame[i].value;
            }
        }
        return null;
    }

    refreshShow() {
        this.totalTroopsLabel.string = this.leftTroops.toString() + "/" + this.capacityTroops.toString();
        this.currentRoomTroopsLabel.string = this.roomCurrentTroops.toString() + "/" + this.roomCapacityTroops.toString();
        this.currentLocationTroopsLabel.string = this.currentLocationCurrentTroops.toString() + "/" + this.currentLocationCapacityTroops.toString();
        this.currentLocationTroopsLabel2.string = "x" + this.currentLocationCurrentTroops.toString();

        this.sprTroop.spriteFrame = this.getTroopTypeSpriteFrame(this.troopIndex);
    }

    onClickDeploy() {
        console.log("点击了部署按钮");
        CGlobalData.instance.DeployTroop(this.roomIndex, this.troopIndex, this.currentLocationCurrentTroops);

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_refresh, true, { roomIdx: this.roomIndex }));

        this.Show(false);
    }

    onClickClose() {
        this.Show(false);
    }

    onClickReduce() {
        console.log("点击了减少按钮");

        if (this.currentLocationCurrentTroops > 0) {
            this.leftTroops += 1;
            this.roomCurrentTroops -= 1;
            this.currentLocationCurrentTroops -= 1;
            this.refreshShow();
        }

    }

    onClickIncrease() {
        console.log("点击了增加按钮");
        if (this.currentLocationCurrentTroops < this.currentLocationCapacityTroops) {
            this.leftTroops -= 1;
            this.roomCurrentTroops += 1;
            this.currentLocationCurrentTroops += 1;
            this.refreshShow();
        }
    }

    Show(bShow: boolean) {
        this.node.active = bShow;

        if (!bShow) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
        }
    }
}


