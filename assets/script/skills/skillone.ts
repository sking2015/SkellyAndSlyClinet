import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";

//单体类技能，只对一个目标生效
export class CSkillOne extends CSkillBase {

    //技能动作
    act: string = ""
    Init() {
        this.act = "attack";
    }
    //只检查是否还活着
    IsValidTarget(): boolean {
        return this.target.IsAlive();
    }

    doCast(cb: Function) {
        this.target.onHitedReady(this.caster);
        this.caster.play(this.act, () => {
            this.target.onHited();
        });
    }
}