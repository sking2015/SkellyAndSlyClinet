import { _decorator, Component, instantiate, Label, Node, Sprite } from 'cc';
import { CUIProperty } from './UIProperty';
import { CUISkillInfo } from './UISkillInfo';
import { CUIElement } from './UIElement';
import { eCCharacterID, eProperty } from './BaseDef';
import { CResManager } from './ResManager';
import { CCharacter } from './character/character';
import { CGlobalData } from './GlobalData';

const { ccclass, property } = _decorator;

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
    lblRace: Sprite = null;

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

    @property({ type: CUIElement, tooltip: "抗性" })
    arrUIResist: CUIElement[] = [];


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

    initAllProperties() {
        //初始化属性UI列表，方便后期操作
        const arrNodePros = this.nodeProperties.children;
        for (let i = 0; i < arrNodePros.length; ++i) {
            const comPro: CUIProperty = arrNodePros[i].getComponent(CUIProperty);
            this.mapProperties.set(comPro.ePro, comPro);
        }
    }

    refreshRole() {
        this.nodeRoleBase.removeAllChildren();

        const prefabRole = CResManager.instance.getCharPrefab(this.eCharId);
        const nodeRole = instantiate(prefabRole);
        nodeRole.parent = this.nodeRoleBase;
        this.charRole = nodeRole.getComponent(CCharacter);
        if (this.nLevel == 0) {
            this.charRole.ToStone();
        } else {
            this.charRole.ResumeFromStone();
        }
    }

    refresShow() {
        this.refreshRole();
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


