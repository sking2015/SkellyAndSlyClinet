import { _decorator, Button, Component, Node, Sprite, SpriteFrame } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CResManager } from './ResManager';
import { eCCharacterID } from './BaseDef';
import { CCharData } from './CharacatersData';

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

    eID: eCCharacterID = eCCharacterID.eciNone;

    setOverseer(data: CCharData) {
        this.eID = data.ID;
        if (data.Level > 0 && this.eID != eCCharacterID.eciNone) {
            const sf: SpriteFrame = CResManager.instance.getCharHead(data.ID);
            this.sprIcon.spriteFrame = sf;
            this.getComponent(Button).interactable = true;
        } else {
            this.getComponent(Button).interactable = false;
        }
    }

    onClick() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_overseer, true, { osType: this.eID }))
    }


    start() {
        this.nodeSelected.active = false;
    }

    setSelect(bSelected: boolean) {
        console.log(this.eID, "设置选中状态", bSelected);
        this.nodeSelected.active = bSelected;
    }

    update(deltaTime: number) {

    }
}


