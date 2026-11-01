import { CSkillBase } from './skillbase';
import { CSkillOnce } from './skillonce';
import { CSkillCure } from './skillcure';
import { CSkillLanche } from './skillLanche';
import { CSkillRepeatedly } from './skillRepeatedly';
import { CSkillRepeatRange } from './skillRepeatRange';
import { eSkillClass } from '../BaseDef';
import { CSkillRange } from './skillRange';
import { CBattleRole } from '../character/battlerole';
import { ISkillsCfg, SkillsCfgData } from '../config/SkillsCfg';

const mapSkillClass2SkillClass: { [key: number]: typeof CSkillBase } = {
    [eSkillClass.estOnce]: CSkillOnce,
    [eSkillClass.estCure]: CSkillCure,
    [eSkillClass.estLanche]: CSkillLanche,
    [eSkillClass.estRange]: CSkillRange,
    [eSkillClass.estRepeatedly]: CSkillRepeatedly,
    [eSkillClass.estRepeatRange]: CSkillRepeatRange
};


export class CSkillFactory {
    static CreateSkill(caster: CBattleRole, skillId: number): CSkillBase {
        const skillData: ISkillsCfg = SkillsCfgData[skillId];
        if (!skillData) {
            throw new Error(`Unknown skill ID: ${skillId}`);
        }
        const SkillClass = mapSkillClass2SkillClass[skillData.SkillClass];
        if (SkillClass) {
            const skill = new SkillClass(caster);
            skill.LoadData(skillData);
            return skill;
        }
        throw new Error(`Unknown skill class: ${skillData.SkillClass}`);
    }
}
