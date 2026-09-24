import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { eTroopType, mapTroop2ID, eCharPlace } from './BaseDef';
import { CGlobalData } from './GlobalData';
import { CResManager } from './ResManager';
import { CCharactersData } from './CharacatersData';
import { CCharacter } from './character/character';
import { getI18nText } from './i18nLan';
import { ITroop_Upgrades, Troop_UpgradesData } from './config/Troop_Upgrades';
import { CBarrackRoom } from './room/BarrackRoom';
import { Label } from 'cc';

const { ccclass, property } = _decorator;

const MAX_LV_Placeholder = "--";

@ccclass('CTroopUpgrade')
export class CTroopUpgrade extends Component {

    @property({ type: Node, tooltip: "升级前部队展示基台" })
    nodeTroopSrc: Node = null;

    @property({ type: Node, tooltip: "升级后部队展示基台" })
    nodeTroopTar: Node = null;

    @property({ type: Label, tooltip: "升级前等级" })
    lblSrcLv: Label = null;

    @property({ type: Label, tooltip: "升级前血量" })
    lblSrcHP: Label = null;

    @property({ type: Label, tooltip: "升级前攻击" })
    lblSrcATK: Label = null;

    @property({ type: Label, tooltip: "升级前防御" })
    lblSrcDEF: Label = null;


    @property({ type: Label, tooltip: "升级后等级" })
    lblTarLv: Label = null;

    @property({ type: Label, tooltip: "升级后血量" })
    lblTarHP: Label = null;

    @property({ type: Label, tooltip: "升级后攻击" })
    lblTarATK: Label = null;

    @property({ type: Label, tooltip: "升级后防御" })
    lblTarDEF: Label = null;


    @property({ type: Label, tooltip: "升级所需金币" })
    lblCostCoin: Label = null;

    @property({ type: Label, tooltip: "升级所需水晶" })
    lblCostCrystal: Label = null;


    @property({ type: Node, tooltip: "满级提示" })
    nodeMaxLvTip: Node = null;




    ett: eTroopType = eTroopType.ettNone;

    nCurTroopLevel: number = 0;

    nSrcTroopId: number = 0;
    nTarTroopId: number = 0;

    troopSrc: CCharacter = null;
    troopTar: CCharacter = null;

    nCostCoin: number = 0;
    nCostCrystal: number = 0;

    //和兵营需要绑定，免得再去房间列表中找
    comBarrackRoom: CBarrackRoom = null;

    start() {
    }

    update(deltaTime: number) {

    }

    setBarrackRoom(comBR: CBarrackRoom) {
        this.comBarrackRoom = comBR;
    }

    setTroopType(ett: eTroopType) {
        let level = CGlobalData.instance.getTroopLevel(ett);
        if (this.ett != ett || level != this.nCurTroopLevel) {
            this.ett = ett;
            console.log("cur ett:", this.ett);

            this.refreshShow();
        }
    }

    refreshShow() {
        if (this.ett != eTroopType.ettNone) {
            this.nodeTroopSrc.removeAllChildren();
            this.nodeTroopTar.removeAllChildren();

            let level = CGlobalData.instance.getTroopLevel(this.ett);
            this.nCurTroopLevel = level;

            this.nSrcTroopId = mapTroop2ID[this.ett][level - 1] as number;


            CResManager.instance.dynLoadMonster(CCharactersData.instance.GetCharPrefabPath(this.nSrcTroopId), (prefab: Prefab) => {
                const nodeRole = instantiate(prefab);
                nodeRole.parent = this.nodeTroopSrc;
                this.troopSrc = nodeRole.getComponent(CCharacter);

                this.troopSrc.SetPlace(eCharPlace.ecpShow);
                this.troopSrc.playStand();
            })


            let oriLvInfo: ITroop_Upgrades = Troop_UpgradesData[this.nSrcTroopId];
            this.lblSrcLv.string = level.toString();
            this.lblSrcHP.string = oriLvInfo.HP.toString();
            this.lblSrcATK.string = oriLvInfo.Attack.toString();
            this.lblSrcDEF.string = oriLvInfo.Defense.toString();


            //只有等级未满，才有升级数据
            if (level < mapTroop2ID[this.ett].length) {
                this.nodeMaxLvTip.active = false;
                this.nTarTroopId = mapTroop2ID[this.ett][level] as number;

                CResManager.instance.dynLoadMonster(CCharactersData.instance.GetCharPrefabPath(this.nTarTroopId), (prefab: Prefab) => {
                    const nodeRole = instantiate(prefab);
                    nodeRole.parent = this.nodeTroopTar;
                    this.troopTar = nodeRole.getComponent(CCharacter);

                    this.troopTar.SetPlace(eCharPlace.ecpShow);
                    this.troopTar.playStand();
                })

                let lvupInfo: ITroop_Upgrades = Troop_UpgradesData[this.nTarTroopId];

                this.nCostCoin = lvupInfo.Cost_Gold;
                this.nCostCrystal = lvupInfo.Cost_Gem;

                this.lblCostCoin.string = this.nCostCoin.toString();
                this.lblCostCrystal.string = this.nCostCrystal.toString();


                this.lblTarLv.string = (level + 1).toString();
                this.lblTarHP.string = lvupInfo.HP.toString();
                this.lblTarATK.string = lvupInfo.Attack.toString();
                this.lblTarDEF.string = lvupInfo.Defense.toString();
            } else {

                this.lblCostCoin.string = MAX_LV_Placeholder;
                this.lblCostCrystal.string = MAX_LV_Placeholder;

                this.nodeMaxLvTip.active = true;
                this.lblTarLv.string = MAX_LV_Placeholder;
                this.lblTarHP.string = MAX_LV_Placeholder;
                this.lblTarATK.string = MAX_LV_Placeholder;
                this.lblTarDEF.string = MAX_LV_Placeholder;

            }
        }

    }

    onClickConfirm() {
        if (this.nCurTroopLevel >= mapTroop2ID[this.ett].length) {
            console.log("部队已经满级");
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: getI18nText("MAX_LV_TIP_4_UNIT") }));

        } else if (CGlobalData.instance.nCoin >= this.nCostCoin && CGlobalData.instance.nCrystal >= this.nCostCrystal) {
            CGlobalData.instance.nCoin -= this.nCostCoin;
            CGlobalData.instance.nCrystal -= this.nCostCrystal;

            CGlobalData.instance.doTroopLvUp(this.ett);

            //再通知主界面刷新一次。。。
            this.node.dispatchEvent((new CustomEvent(UniEvent.on_resource_change, true)));
            this.node.dispatchEvent((new CustomEvent(UniEvent.on_troop_upgrade, true)));

            this.comBarrackRoom.onTroopUpgrad();
        }

        this.Show(false);
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


