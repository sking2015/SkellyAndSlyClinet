import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";
import { ISkillsCfg } from "../config/SkillsCfg";

//单体类技能，只对一个目标生效
export class CSkillOnce extends CSkillBase {

    //技能动作
    act: string = ""
    private hasHit: boolean = false;

    OnAnimationHit() {
        if (this.hasHit) return;
        this.hasHit = true;
        if (this.hasValidTarget()) this.target.onHited(this.caster, this.GetEffectData());
    }
    Init() {
    }

    LoadData(cfg: ISkillsCfg) {
        super.LoadData(cfg);
        this.act = "attack";
        this.eTarType = eSkillTargetType.estEnemies;
    }


    doCast(cb?: Function) {
        this.hasHit = false;
        super.doCast(cb);
        // console.log("释放技能 CSkillOne");     
        this.target.onHitedReady(this.caster);
        this.caster.play(this.act, () => {
            // console.log("技能播放完毕", this.caster);

            //有可能已经在其它地方释放了，先挡一下
            this.OnAnimationHit();

            this.caster.SwitchToStand();
            cb ? cb() : null;
        });
    }
}
