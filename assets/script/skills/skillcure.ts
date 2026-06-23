import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";

//单体类技能，只对一个目标生效
export class CSkillCure extends CSkillBase {

    //技能动作
    act: string = ""
    Init() {
    }

    LoadData() {
        this.act = "action";
        this.eTarType = eSkillTargetType.estAlly;
        this.nSkillRange = 1000;
    }

    OnSelectTarget() {
        this.target = this.SearchLowestHPTarget();
    }

    //只检查是否还活着
    IsValidTarget(): boolean {
        return this.target.IsAlive();
    }

    doCast(cb?: Function) {
        super.doCast(cb);
        // console.log("释放技能 CSkillOne");
        this.caster.onBeforeCastSkill();
        this.caster.onCastSkillToTarget(this.target);
        this.target.onHeal();
        this.caster.play(this.act, () => {
            // console.log("技能播放完毕", this.caster);
            this.caster.onAfterCastSkill();
            this.caster.SwitchToStand();
            cb ? cb() : null;
        });
    }
}