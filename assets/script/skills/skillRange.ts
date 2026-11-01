import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";
import { ISkillsCfg } from "../config/SkillsCfg";

// 范围技能，按配置限制目标数量。
export class CSkillRange extends CSkillBase {

    //技能动作
    act: string = ""
    private hasHit: boolean = false;

    OnAnimationHit() {
        if (this.hasHit) return;
        this.hasHit = true;
        this.caster.onStrikeTargets(this.GetEffectData());
    }
    Init() {
    }

    LoadData(cfg: ISkillsCfg) {
        super.LoadData(cfg);
        this.act = "attack";
        this.eTarType = eSkillTargetType.estEnemies;
    }
    IsRangeAffect(): boolean {
        return true;
    }
    //只检查是否还活着
    hasValidTarget(): boolean {
        return this.arrTargets.length > 0;
    }

    doCast(cb?: Function) {
        this.hasHit = false;
        super.doCast(cb);
        // console.log("释放技能 CSkillOne");
        for (const target of this.arrTargets) target.onHitedReady(this.caster);
        this.caster.play(this.act, () => {
            // console.log("技能播放完毕", this.caster);
            this.OnAnimationHit();
            this.caster.SwitchToStand();
            cb ? cb() : null;
        });
    }
}
