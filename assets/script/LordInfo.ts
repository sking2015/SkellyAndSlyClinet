import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { CGlobalData } from './GlobalData';
import { eCCharacterID } from './BaseDef';
import { CCharactersData } from './CharacatersData';
import { CResManager } from './ResManager';
const { ccclass, property } = _decorator;

@ccclass('CLordInfo')
export class CLordInfo extends Component {

    @property({ type: Label, tooltip: "领主等级" })
    lblLevel: Label = null;

    @property({ type: Sprite, tooltip: "房间领主头像" })
    sprHead: Sprite = null;

    @property({ type: Label, tooltip: "领主名讳" })
    lblName: Label = null;

    @property({ type: Label, tooltip: "领主血量" })
    lblHealth: Label = null;

    start() {

    }

    setLevel(level: number) {
        if (level > 0) {
            this.lblLevel.string = "LV" + level.toString();
        } else {
            this.lblLevel.string = "";
        }

    }

    setName(name: string) {
        this.lblName.string = name;
    }

    setHealth(health: number) {
        if (health > 0) {
            this.lblHealth.string = health.toString();
        } else {
            this.lblHealth.string = "";
        }
    }

    setHeadSprite(sf: SpriteFrame) {
        this.sprHead.spriteFrame = sf;
    }

    setCharID(charID: eCCharacterID) {
        const nLevel = CGlobalData.instance.getMonsterLevel(charID);
        if (nLevel > 0) {
            const charData = CCharactersData.instance.GetCharData(charID, nLevel);
            if (charData) {
                this.setName(charData.Name);
                this.setHealth(charData.HP);
                this.setLevel(nLevel);

                this.setHeadSprite(CResManager.instance.getImg(charData.Head));
            }
        } else {
            this.setName("");
            this.setHealth(0);
            this.setLevel(0);
            this.setHeadSprite(null);
        }
    }

    update(deltaTime: number) {

    }
}


