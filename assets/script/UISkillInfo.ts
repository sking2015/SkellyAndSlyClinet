import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CUISkillInfo')
export class CUISkillInfo extends Component {

    @property({ type: Sprite, tooltip: "技能图标" })
    sprIcon: Sprite = null;

    @property({ type: Label, tooltip: "技能名字" })
    lblName: Label = null;

    @property({ type: Label, tooltip: "技能等级" })
    lblLevel: Label = null;

    @property({ type: Label, tooltip: "技能预估伤害" })
    lblDamage: Label = null;

    start() {

    }

    update(deltaTime: number) {

    }
}


