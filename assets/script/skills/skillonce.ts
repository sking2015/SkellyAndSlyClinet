import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";

//单体类技能，只对一个目标生效
export class CSkillOnce extends CSkillBase {

    //技能动作
    act: string = ""
    Init() {
    }

    LoadData() {
        this.act = "attack";
        this.eTarType = eSkillTargetType.estEnemies;
        this.nSkillRange = 5;
    }


    doCast(cb?: Function) {
        super.doCast(cb);
        // console.log("释放技能 CSkillOne");     
        this.target.onHitedReady(this.caster);
        this.caster.play(this.act, () => {
            // console.log("技能播放完毕", this.caster);

            //有可能已经在其它地方释放了，先挡一下
            if (this.target) {
                this.target.onHited();
            }

            this.caster.SwitchToStand();
            cb ? cb() : null;
        });
    }
}