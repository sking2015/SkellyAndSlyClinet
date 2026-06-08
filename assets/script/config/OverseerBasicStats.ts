/** 自动生成 TS 配置 */

export interface IOverseerBasicStats {
    readonly ID: number;
    readonly OverseerName: string;
    readonly Skill_1_ID: string;
    readonly Skill_2_ID: string;
    readonly Skill_3_ID: string;
    readonly Recruit_Cost: number;
    readonly Description: string;
}

export const OverseerBasicStatsData: Record<string | number, IOverseerBasicStats> = {
    1: {
        "ID": 1,
        "OverseerName": "Eye Tyrant",
        "Skill_1_ID": "1001",
        "Skill_2_ID": "1006",
        "Skill_3_ID": "0",
        "Recruit_Cost": 500,
        "Description": "OS_EYETYRANT_DESC"
    },
    2: {
        "ID": 2,
        "OverseerName": "Lich",
        "Skill_1_ID": "1100",
        "Skill_2_ID": "1055",
        "Skill_3_ID": "0",
        "Recruit_Cost": 500,
        "Description": "OS_LICH_DESC"
    },
    3: {
        "ID": 3,
        "OverseerName": "Orc",
        "Skill_1_ID": "1050",
        "Skill_2_ID": "1105",
        "Skill_3_ID": "0",
        "Recruit_Cost": 500,
        "Description": "OS_ORC_DESC"
    }
};
