import { _decorator, Button, Component, Node, Sprite, SpriteFrame } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CResManager } from './ResManager';
import { CCharacterData } from './GlobalData';
import { CCharacterID } from './BaseDef';

const { ccclass, property } = _decorator;

@ccclass('OSSelectBtn')
export default class OSSelectBtn extends Component {
    @property({
        type: Sprite,
        tooltip: "用来表示监工的头像"
    })
    sprIcon: Sprite = null;

    @property({
        type: Node,
        tooltip: "是否为选中状态"
    })
    nodeSelected: Node = null;

    eType: CCharacterID = CCharacterID.eciNoe;

    setOverseer(data: CCharacterData) {
        this.eType = data.eType;
        if (data.level > 0 && this.eType != CCharacterID.eciNoe) {
            const sf: SpriteFrame = CResManager.instance.getCharHead(data.eType);
            this.sprIcon.spriteFrame = sf;
            this.getComponent(Button).interactable = true;
        } else {
            this.getComponent(Button).interactable = false;
        }
    }

    onClick() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_overseer, true, { osType: this.eType }))
    }


    start() {
        this.nodeSelected.active = false;
    }

    setSelect(bSelected: boolean) {
        console.log(this.eType, "设置选中状态", bSelected);
        this.nodeSelected.active = bSelected;
    }

    update(deltaTime: number) {

    }
}


