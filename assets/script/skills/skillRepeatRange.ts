import { CCharacter } from "../character/character";
import { CSkillRepeatedly } from "./skillRepeatedly";
import { eSkillTargetType } from "../BaseDef";
import { ISkillsCfg } from "../config/SkillsCfg";

//多段范围伤害类技能
export class CSkillRepeatRange extends CSkillRepeatedly {

    LoadData(cfg: ISkillsCfg) {
        super.LoadData(cfg);
    }

    IsRangeAffect(): boolean {
        return true;
    }

    hasValidTarget(): boolean {
        return this.arrTargets.length > 0
    }

    StrikeOnce() {
        for (let i = 0; i < this.arrTargets.length; ++i) {
            const tar = this.arrTargets[i];
            if (!tar.IsAlive() || !tar.getInBattle()) continue;
            tar.onHitedReady(this.caster);
            tar.onHited(this.caster, this.GetEffectData());
        }
    }
}
