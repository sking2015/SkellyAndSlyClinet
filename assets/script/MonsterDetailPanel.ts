import { _decorator, Component, instantiate, Label, Node, Sprite } from 'cc';
import { CUIProperty } from './UIProperty';
import { CUISkillInfo } from './UISkillInfo';
import { CUIElement } from './UIElement';
import { eCCharacterID, eProperty, eCharPlace } from './BaseDef';
import { CResManager } from './ResManager';
import { CCharacter } from './character/character';
import { CGlobalData } from './GlobalData';
import { formatCompactNumber } from './common/common';
import { CCharData } from './CharacatersData';


const { ccclass, property } = _decorator;

const PRO_MAX_HP = 9999;
const PRO_MAX_OHTER = 999;

@ccclass('CMonsterDetailPanel')
export class CMonsterDetailPanel extends Component {

    @property({ type: Label, tooltip: "当前金币" })
    lblCurCoin: Label = null;

    @property({ type: Label, tooltip: "当前食物" })
    lblCurFood: Label = null;

    @property({ type: Label, tooltip: "当前灵魂碎片" })
    lblCurSoul: Label = null;

    @property({ type: Label, tooltip: "魔物名" })
    lblName: Label = null;

    @property({ type: Label, tooltip: "当前魔物等级" })
    lblLevel: Label = null;

    @property({ type: Sprite, tooltip: "魔物种族图标" })
    sprRace: Sprite = null;

    @property({ type: Node, tooltip: "角色展示台，角色扔这里" })
    nodeRoleBase: Node = null;

    @property({ type: Label, tooltip: "当前金币" })
    lblCostCoin: Label = null;

    @property({ type: Label, tooltip: "当前食物" })
    lblCostFood: Label = null;

    @property({ type: Label, tooltip: "当前灵魂碎片" })
    lblCostSoul: Label = null;

    @property({ type: Node, tooltip: "属性展示根节点" })
    nodeProperties: Node = null;

    @property({ type: CUISkillInfo, tooltip: "技能" })
    arrUISkills: CUISkillInfo[] = [];

    @property({ type: CUIElement, tooltip: "火抗" })
    uiFireResist: CUIElement = null;

    @property({ type: CUIElement, tooltip: "冰抗" })
    uiIceResist: CUIElement = null;

    @property({ type: CUIElement, tooltip: "风抗" })
    uiWindResist: CUIElement = null;

    @property({ type: CUIElement, tooltip: "雷抗" })
    uiThunderResist: CUIElement = null;

    @property({ type: CUIElement, tooltip: "暗抗" })
    uiDarkResist: CUIElement = null;

    @property({ type: CUIElement, tooltip: "光抗" })
    uiHolyResist: CUIElement = null;


    eCharId: eCCharacterID = eCCharacterID.eciNoe;
    nLevel: number = 0;

    charRole: CCharacter = null;

    //保存一下属性UI
    mapProperties: Map<eProperty, CUIProperty> = new Map();

    start() {
        this.initAllProperties();
    }

    setCharID(eID: eCCharacterID) {
        this.eCharId = eID;
        this.nLevel = CGlobalData.instance.getMonsterLevel(this.eCharId);
    }

    data: CCharData = null;
    setChar(data: CCharData) {
        this.eCharId = data.ID;
        this.data = data;
    }

    initAllProperties() {
        //初始化属性UI列表，方便后期操作
        const arrNodePros = this.nodeProperties.children;
        for (let i = 0; i < arrNodePros.length; ++i) {
            const comPro: CUIProperty = arrNodePros[i].getComponent(CUIProperty);
            if (comPro.ePro == eProperty.eProHP) {
                comPro.setMaxValue(PRO_MAX_HP);
            } else {
                comPro.setMaxValue(PRO_MAX_OHTER);
            }
            this.mapProperties.set(comPro.ePro, comPro);
        }
    }

    refreshRole() {
        this.nodeRoleBase.removeAllChildren();

        const prefabRole = CResManager.instance.getCharPrefab(this.eCharId);
        const nodeRole = instantiate(prefabRole);
        nodeRole.parent = this.nodeRoleBase;
        this.charRole = nodeRole.getComponent(CCharacter);

        this.charRole.SetPlace(eCharPlace.ecpShow);
        if (this.nLevel == 0) {
            this.charRole.ToStone();
        } else {
            this.charRole.ResumeFromStone();
        }
    }

    refresShow() {
        this.refreshRole();

        this.lblCurCoin.string = formatCompactNumber(CGlobalData.instance.nCoin);
        this.lblCurFood.string = formatCompactNumber(CGlobalData.instance.nFood);
        this.lblCurSoul.string = formatCompactNumber(CGlobalData.instance.nSoul);

        this.lblName.string = this.data.Name;
        this.lblLevel.string = "LV:" + this.data.Level.toString();

        this.sprRace.spriteFrame = CResManager.instance.getRaceIcon(this.data.Race);

        this.mapProperties.forEach((uiPro: CUIProperty, ePro: eProperty) => {
            uiPro.setCurValue(this.data.getProperty(ePro));
        })

        this.uiFireResist.setValue(this.data.ResisFire);
        this.uiIceResist.setValue(this.data.ResisIce);
        this.uiWindResist.setValue(this.data.ResisWind);
        this.uiThunderResist.setValue(this.data.ResisThunder);
        this.uiDarkResist.setValue(this.data.ResisDark);
        this.uiHolyResist.setValue(this.data.ResisShine);

        this.lblCostCoin.string = formatCompactNumber(this.data.CostCoin);
        this.lblCostFood.string = formatCompactNumber(this.data.CostFood);
        this.lblCostSoul.string = formatCompactNumber(this.data.CostSoul);

    }

    lastPanel: Node = null;
    onClickReturn() {
        this.node.active = false;
        this.lastPanel.active = true;
    }

    ShowFromOther(panel: Node) {
        this.node.active = true;
        this.lastPanel = panel;

        this.refresShow();
    }

    Close() {
        this.node.active = false;
    }



    onClickRefore() {
        this.doReforge();
    }

    doReforge() {
        this.charRole.ResumeFromStone();
        this.charRole.playEffect();
    }

    onClickStory() {
        console.log("点击了故事图标");
    }

    update(deltaTime: number) {

    }
}


