import { _decorator, Component, Node, Label, Sprite, SpriteFrame } from 'cc';
import { eCCharacterID } from './BaseDef';
import { CCharData, CCharactersData } from './CharacatersData';
import { CGlobalData } from './GlobalData';
import { CResManager } from './ResManager';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CCharButton')
export class CCharButton extends Component {

    @property({ type: Label, tooltip: "显示名字" })
    lblName: Label;

    @property({ type: Sprite, tooltip: "魔物头像" })
    sprHead: Sprite;

    @property({ type: Label, tooltip: "等级" })
    lblLevel: Label;

    @property({ type: Label, tooltip: "血量" })
    lblHP: Label;

    @property({ type: Label, tooltip: "攻击" })
    lblAtk: Label;

    @property({ type: Label, tooltip: "防御" })
    lblDef: Label;

    @property({ type: Label, tooltip: "统领" })
    lblLCA: Label;

    @property({ type: Sprite, tooltip: "获得标记，分为为NEW和GET" })
    sprMark: Sprite;

    @property({ type: SpriteFrame, tooltip: "配置新获得和已获得标记" })
    sfMark: SpriteFrame[] = [];

    eCharID: eCCharacterID = eCCharacterID.eciNone;
    level: number = 0;

    data: CCharData = null;

    // 是否是选择模式，选择模式下会屏蔽还未解锁的角色，也就是等级为零的角色
    bSelectMode: boolean = false;

    //在选择模式下是否禁用
    bDisbled: boolean = false;

    cbClick: (charId: eCCharacterID) => void = null;

    setCallBack4Click(callback: (charId: eCCharacterID) => void) {
        this.cbClick = callback;
    }

    start() {
    }

    setSelectMode(bMode: boolean) {
        this.bSelectMode = bMode;
    }

    parentPanel: Node = null;
    SetParentPanel(panel: Node) {
        this.parentPanel = panel;
    }

    SetCharId(eID: eCCharacterID) {
        this.eCharID = eID;
        this.refreshData();
    }

    setCharData(data: CCharData) {
        this.eCharID = data.ID;
        this.level = data.Level;
        //console.log("设置魔物按钮数据，魔物ID", this.eCharID, "等级", this.level);
        this.data = data;

        this.refreshShow();
    }

    refreshData() {
        this.level = CGlobalData.instance.getMonsterLevel(this.eCharID);
        //console.log("刷新魔物按钮数据，魔物ID", this.eCharID, "等级", this.level);
        this.data = CCharactersData.instance.GetCharData(this.eCharID, this.level);
        this.refreshShow();
    }

    private refreshShow() {
        console.log("refreshShow~~", this.eCharID, this.level, this.data);
        if (!this.data) {
            console.error("没有魔物数据，无法刷新显示");
            return;
        }

        this.lblName.string = this.data.Name;
        this.sprHead.spriteFrame = CResManager.instance.getImg(this.data.Head);

        const nShowLevel = this.level > 0 ? this.level : 1;
        this.lblLevel.string = "LV " + nShowLevel;

        this.lblHP.string = this.data.HP.toString();
        this.lblAtk.string = this.data.ATK.toString();
        this.lblDef.string = this.data.DEF.toString();
        this.lblLCA.string = this.data.LCA.toString();

        if (this.bSelectMode && this.level <= 0) {
            this.sprHead.grayscale = true;
            this.node.getComponent(Button).interactable = false;
            this.sprMark.node.active = false;
        } else {
            this.sprMark.node.active = true;
            if (this.level > 0) {
                this.sprMark.spriteFrame = this.sfMark[1];
            } else {
                this.sprMark.spriteFrame = this.sfMark[0];
            }
        }
    }

    onClick() {
        this.parentPanel.active = false;
        if (this.cbClick) {
            this.cbClick(this.eCharID);
        } else {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_char_ui, true, { charID: this.eCharID, data: this.data, panel: this.parentPanel }))
        }
    }

    update(deltaTime: number) {

    }
}


