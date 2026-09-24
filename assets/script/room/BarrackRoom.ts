import { _decorator, Component, Prefab, Node } from 'cc';
import { CCheckGroup } from '../common/checkGroup';
import { CBaseRoom } from './BaseRoom';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { eCharPlace, eTroopType, mapTroop2ID } from '../BaseDef';
import { CResManager } from '../ResManager';
import { CCharData, CCharactersData } from '../CharacatersData';
import { instantiate } from 'cc';
import { CCharacter } from '../character/character';
import { Label } from 'cc';
import { CGlobalData } from '../GlobalData';
import { ITroop_Produce, Troop_ProduceData } from "../config/Troop_Produce"


const { ccclass, property } = _decorator;

@ccclass('CBarrackRoom')
export class CBarrackRoom extends CBaseRoom {

    @property(CCheckGroup)
    checkGroup: CCheckGroup | null = null;

    @property({ type: Node, tooltip: "部队显示基座" })
    troopBase: Node | null = null;

    @property({ type: Label, tooltip: "已训练部队存量" })
    troopCountLabel: Label | null = null;

    @property({ type: Label, tooltip: "训练部队数量" })
    troopTrainingLabel: Label | null = null;

    @property({ type: Label, tooltip: "生产部队所需要金币" })
    lblTrainCoin: Label = null;

    @property({ type: Label, tooltip: "生产部队所需要金属" })
    lblTrainMetal: Label = null;

    @property({ type: Node, tooltip: "部队出生点" })
    troopBornPos: Node | null = null;


    @property({ type: Label, tooltip: "部队等级" })
    lblTroopLv: Label = null;

    @property({ type: Label, tooltip: "部队血量" })
    lblTroopHP: Label = null;

    @property({ type: Label, tooltip: "部队攻击" })
    lblTroopATK: Label = null;

    @property({ type: Label, tooltip: "部队防御" })
    lblTroopDEF: Label = null;


    trainingTroopCount: number = 0; //当前训练部队数量

    //当前部队
    eCurTroopType: eTroopType = eTroopType.ettNone;

    nCurTroopId: number = 0;

    charTroop: CCharacter = null;

    start() {
        super.start();
        this.refreshRoomShow();

        this.checkGroup?.setCheckBoxState(0);
    }

    onOpenExpand() {
        super.onOpenExpand();
        this.refreshTroopRole();
        this.refreshTrainingTroopCount();
        this.refreshTroopCount();
    }

    refreshTroopCount() {
        this.troopCountLabel.string = this.getTroopCountString();
    }

    refreshTrainingTroopCount() {
        this.troopTrainingLabel.string = this.getTrainingTroopString();
        this.refreshCost();
    }

    refreshCost() {
        let troopData: ITroop_Produce = Troop_ProduceData[this.nCurTroopId];
        console.log("troopData", troopData);

        let nTotalCoin = troopData.Cost_Gold * this.trainingTroopCount;
        let nTotalMetal = troopData.Cost_Metal * this.trainingTroopCount;

        this.lblTrainCoin.string = nTotalCoin.toString();
        this.lblTrainMetal.string = nTotalMetal.toString();
    }

    refreshTroopRole(bPlayEffect: boolean = false) {
        this.troopBase.removeAllChildren();

        let nTroopIndex = this.checkGroup.getCurCheckedIndex() + 1;

        this.eCurTroopType = nTroopIndex as eTroopType;

        let level = CGlobalData.instance.getTroopLevel(this.eCurTroopType);

        this.nCurTroopId = mapTroop2ID[this.eCurTroopType][level - 1] as number;

        this.refreshCost();

        let troopData: ITroop_Produce = Troop_ProduceData[this.nCurTroopId];
        console.log("troopData", troopData);

        this.lblTroopLv.string = level.toString();
        this.lblTroopHP.string = troopData.Base_HP.toString();
        this.lblTroopATK.string = troopData.Base_Attack.toString();
        this.lblTroopDEF.string = troopData.Base_Defense.toString();


        CResManager.instance.dynLoadMonster(CCharactersData.instance.GetCharPrefabPath(this.nCurTroopId), (prefab: Prefab) => {
            const nodeRole = instantiate(prefab);
            nodeRole.parent = this.troopBase;
            this.charTroop = nodeRole.getComponent(CCharacter);

            this.charTroop.SetPlace(eCharPlace.ecpShow);
            this.charTroop.playStand();

            if (bPlayEffect) {
                this.charTroop.playEffect();
            }
        })

    }

    onUnlock() {
        this.refreshTroopRole();
        // this.testBattle();
    }

    onClickTroopBtn(event: Event, customEventData: string) {
        console.log("onClickTroopClassBtn", customEventData);
        let nIndex = parseInt(customEventData) - 1;
        this.checkGroup?.setCheckBoxState(nIndex);
        this.refreshTroopRole();
        this.refreshTroopCount();
    }

    onClickTroopUpgradeBtn() {
        console.log("onClickTroopUpgradeBtn");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_troop_upgrade, true, { ett: this.eCurTroopType, comBR: this }));
    }

    onTroopUpgrad() {
        console.log("部队升级....~!!");
        this.refreshTroopRole(true);
    }


    bProducingTroop: boolean = false;
    onClickProduceBtn() {
        console.log("onClickProduceBtn");
        this.bProducingTroop = true;
    }

    nGenInterval: number = 0;
    update(deltaTime: number) {
        if (this.bProducingTroop) {
            this.nGenInterval -= deltaTime;
            if (this.nGenInterval <= 0) {
                this.refreshOneTroop();
                this.nGenInterval = 0.2;
                if (this.trainingTroopCount <= 0) {
                    this.bProducingTroop = false;
                }
            }
        }
    }

    refreshOneTroop() {
        this.genOneTroop();
        this.trainingTroopCount--;
        //实际增加部队
        CGlobalData.instance.genOneTroop(this.eCurTroopType);
        this.refreshTrainingTroopCount();
        this.refreshTroopCount();
    }

    genOneTroop() {
        let role = instantiate(this.charTroop.node);
        role.parent = this.nodeCharLayer;
        role.setPosition(this.troopBornPos.getPosition());
        let char = role.getComponent(CCharacter);
        char.SetPlace(eCharPlace.ecpInRoom);
        char.run2PositionV2(this.troopBornPos.getPosition().x - 50, this.troopBornPos.getPosition().y - 15, () => {
            char.run2PositionV2(-400, char.node.y, () => {
                char.node.destroy();
            })
        });
    }

    getTroopCountString(): string {
        let nCount = 0;
        let nCapacity = 0;
        switch (this.eCurTroopType) {
            case eTroopType.ettSoldier:
                nCount = CGlobalData.instance.getSoldierLeft();
                nCapacity = CGlobalData.instance.getSoldierCapacity();
                break;
            case eTroopType.ettArcher:
                nCount = CGlobalData.instance.getArcherLeft();
                nCapacity = CGlobalData.instance.getArcherCapacity();
                break;
            case eTroopType.ettMage:
                nCount = CGlobalData.instance.getMageLeft();
                nCapacity = CGlobalData.instance.getMageCapacity();
                break;
        }
        return nCount.toString() + "/" + nCapacity.toString();
    }

    getTrainingTroopString(): string {
        let nCapacity = 0;
        switch (this.eCurTroopType) {
            case eTroopType.ettSoldier:
                nCapacity = CGlobalData.instance.getSoldierCapacity();
                break;
            case eTroopType.ettArcher:
                nCapacity = CGlobalData.instance.getArcherCapacity();
                break;
            case eTroopType.ettMage:
                nCapacity = CGlobalData.instance.getMageCapacity();
                break;
        }

        return this.trainingTroopCount.toString() + "/" + nCapacity.toString();
    }

    onClickProduceAddBtn() {
        console.log("onClickProduceAddBtn");
        let nCanTrainingCount = 0;
        switch (this.eCurTroopType) {
            case eTroopType.ettSoldier:
                nCanTrainingCount = CGlobalData.instance.getSoldierCanTrainNum();
                break;
            case eTroopType.ettArcher:
                nCanTrainingCount = CGlobalData.instance.getArcherCanTrainNum();
                break;
            case eTroopType.ettMage:
                nCanTrainingCount = CGlobalData.instance.getMageCanTrainNum();
                break;
        }

        if (this.trainingTroopCount < nCanTrainingCount) {
            this.trainingTroopCount++;
            this.refreshTrainingTroopCount();
        }
    }

    onClickProduceReduceBtn() {
        console.log("onClickProduceReduceBtn");
        if (this.trainingTroopCount > 0) {
            this.trainingTroopCount--;
            this.refreshTrainingTroopCount();
        }
    }
}


