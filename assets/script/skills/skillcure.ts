import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";
import { ISkillsCfg } from "../config/SkillsCfg";

//单体类技能，只对一个目标生效
export class CSkillCure extends CSkillBase {

    //技能动作
    act: string = ""
    Init() {
    }

    LoadData(cfg: ISkillsCfg) {
        super.LoadData(cfg);
        this.act = "action";
        this.eTarType = eSkillTargetType.estAlly;
    }

    OnSelectTarget() {

        const tar = this.SearchLowestHPTarget();
        if (tar && tar.getHPPer() < 0.9) {
            this.target = tar;
        } else {
            this.target = null
        }

    }


    doCast(cb?: Function) {
        super.doCast(cb);
        // console.log("###释放技能 CSkillCure....", this.target);
        this.caster.onBeforeCastSkill();
        this.caster.onCastSkillToTarget(this.target);
        this.target.onHeal(this.GetEffectData().power);
        this.caster.play(this.act, () => {
            // console.log("###释放技能 CSkillCure完毕");
            // console.log("技能播放完毕", this.caster);
            this.caster.onAfterCastSkill();
            this.caster.SwitchToStand();
            cb ? cb() : null;

            //治疗之后要释放目标，重新找血最少的目标
            this.target = null;
        });
    }
}
