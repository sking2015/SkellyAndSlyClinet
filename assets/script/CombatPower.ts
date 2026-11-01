import { eCCharacterID, eSkillActionType, eSkillClass } from './BaseDef';
import { HerosData } from './config/Heros';
import { MonstersData } from './config/Monsters';
import { SkillsCfgData } from './config/SkillsCfg';

/**
 * 满编部署战力，不随当前血量变化：生命 / 10 + 双防 / 2 + 技能秒均效能 * 10。
 * 技能沿用 skillbase 的 BaseData + ATK/INT，按冷却折算输出或治疗。
 * 远程最多加成 20%，范围技能按最多 3 个有效目标估值，多段技能计 10 次。
 * 这些是估值权重，不是实际伤害；不计当前战斗尚未使用的成长、耗蓝、速度、抗性等。
 */
export function getCharacterCombatPower(id: eCCharacterID): number {
    if (id === eCCharacterID.eciNone) return 0;
    const isHero = id > eCCharacterID.eciHerosStart;
    const cfg = isHero ? HerosData[id - eCCharacterID.eciHerosStart] : MonstersData[id];
    if (!cfg) return 0;

    let outputPerSecond = 0;
    for (const value of [cfg.Skill1, cfg.Skill2, cfg.Skill3]) {
        const skill = SkillsCfgData[Number(value)];
        if (!skill) continue;

        const stat = skill.SkillType === eSkillActionType.esatPyhsisc ? cfg.ATK
            : skill.SkillType === eSkillActionType.esatMagic ? cfg.INT : 0;
        const power = Math.max(0, skill.BaseData + stat);
        const repeated = skill.SkillClass === eSkillClass.estRepeatedly
            || skill.SkillClass === eSkillClass.estRepeatRange;
        const hits = repeated ? 10 : 1; // 与 CSkillRepeatedly.nStrikeNum 一致。
        const targets = Math.max(1, Math.min(3, skill.TargetsLimit));
        const rangeBonus = 1 + Math.min(0.2, Math.max(0, skill.SkillRange - 5) / 495 * 0.2);
        outputPerSecond += power * hits * targets * rangeBonus / Math.max(1, skill.CoolDown);
    }

    return Math.round(cfg.HP / 10 + (cfg.DEF + cfg.MDF) / 2 + outputPerSecond * 10);
}
