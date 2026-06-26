import { CCharacter } from "../character/character";
import { CSkillRepeatedly } from "./skillRepeatedly";
import { eSkillTargetType } from "../BaseDef";

//多段范围伤害类技能
export class CSkillRepeatRange extends CSkillRepeatedly {

    LoadData() {
        this.actStart = "skillstart";
        this.actLoop = "skillloop";
        this.actEnd = "skillend";

        this.eTarType = eSkillTargetType.estEnemies;
        this.nSkillRange = 330;
        this.nStrikeNum = 10;
        this.nCD = 10000;
        this.bIsUltimate = true;
        this.nTargetsLimit = 999;           //最多作用目标999，就是没上限，范围内全部可以打击
    }

    hasValidTarget(): boolean {
        return this.arrTargets.length > 0
    }

    StrikeOnce() {
        for (let i = 0; i < this.arrTargets.length; ++i) {
            const tar = this.arrTargets[i];
            tar.onHitedReady(this.caster);
            tar.onHited(this.caster);
        }
    }
}