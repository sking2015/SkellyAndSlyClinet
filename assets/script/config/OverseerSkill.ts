/** 自动生成 TS 配置 */

export interface IOverseerSkill {
    readonly ID: string;
    readonly Skill_Name: string;
    readonly Resource: string;
    readonly Type: string;
    readonly Bonus_Multiplier: number;
    readonly Skill_Icon: string;
    readonly Interface_Display: string;
    readonly Buff_Type: string;
}

export const OverseerSkillData: Record<string | number, IOverseerSkill> = {
    1001: {
        "ID": "1001",
        "Skill_Name": "Bone_Saw_Mutilation",
        "Resource": "Wood",
        "Type": "Yield",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Bone_Saw_Mutilation",
        "Interface_Display": "SKILL_1001_DESC",
        "Buff_Type": "BUFF"
    },
    1002: {
        "ID": "1002",
        "Skill_Name": "Deadwood_Revival",
        "Resource": "Wood",
        "Type": "Yield",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Deadwood_Revival",
        "Interface_Display": "SKILL_1002_DESC",
        "Buff_Type": "BUFF"
    },
    1003: {
        "ID": "1003",
        "Skill_Name": "Frenzied_Chopping",
        "Resource": "Wood",
        "Type": "Yield",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Frenzied_Chopping",
        "Interface_Display": "SKILL_1003_DESC",
        "Buff_Type": "BUFF"
    },
    1004: {
        "ID": "1004",
        "Skill_Name": "Overseer's_Whip",
        "Resource": "Wood",
        "Type": "Yield",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Overseer's_Whip",
        "Interface_Display": "SKILL_1004_DESC",
        "Buff_Type": "BUFF"
    },
    1005: {
        "ID": "1005",
        "Skill_Name": "Venom_Irrigation",
        "Resource": "Wood",
        "Type": "Yield",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Venom_Irrigation",
        "Interface_Display": "SKILL_1005_DESC",
        "Buff_Type": "BUFF"
    },
    1006: {
        "ID": "1006",
        "Skill_Name": "Corrupted_Growth",
        "Resource": "Wood",
        "Type": "Cap",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Corrupted_Growth",
        "Interface_Display": "SKILL_1006_DESC",
        "Buff_Type": "BUFF"
    },
    1007: {
        "ID": "1007",
        "Skill_Name": "Dimensional_Tree_Hole",
        "Resource": "Wood",
        "Type": "Cap",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Dimensional_Tree_Hole",
        "Interface_Display": "SKILL_1007_DESC",
        "Buff_Type": "BUFF"
    },
    1008: {
        "ID": "1008",
        "Skill_Name": "Telekinetic_Lift",
        "Resource": "Wood",
        "Type": "Cap",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Telekinetic_Lift",
        "Interface_Display": "SKILL_1008_DESC",
        "Buff_Type": "BUFF"
    },
    1009: {
        "ID": "1009",
        "Skill_Name": "Undead_Hauling",
        "Resource": "Wood",
        "Type": "Cap",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Undead_Hauling",
        "Interface_Display": "SKILL_1009_DESC",
        "Buff_Type": "BUFF"
    },
    1010: {
        "ID": "1010",
        "Skill_Name": "Underworld_Silo",
        "Resource": "Wood",
        "Type": "Cap",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Underworld_Silo",
        "Interface_Display": "SKILL_1010_DESC",
        "Buff_Type": "BUFF"
    },
    1050: {
        "ID": "1050",
        "Skill_Name": "Blood_Sacrifice",
        "Resource": "Metal",
        "Type": "Yield",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Blood_Sacrifice",
        "Interface_Display": "SKILL_1050_DESC",
        "Buff_Type": "BUFF"
    },
    1051: {
        "ID": "1051",
        "Skill_Name": "Flesh_Binding",
        "Resource": "Metal",
        "Type": "Yield",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Flesh_Binding",
        "Interface_Display": "SKILL_1051_DESC",
        "Buff_Type": "BUFF"
    },
    1052: {
        "ID": "1052",
        "Skill_Name": "Hellfire_Smelting",
        "Resource": "Metal",
        "Type": "Yield",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Hellfire_Smelting",
        "Interface_Display": "SKILL_1052_DESC",
        "Buff_Type": "BUFF"
    },
    1053: {
        "ID": "1053",
        "Skill_Name": "Iron_Maiden_Racks",
        "Resource": "Metal",
        "Type": "Yield",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Iron_Maiden_Racks",
        "Interface_Display": "SKILL_1053_DESC",
        "Buff_Type": "BUFF"
    },
    1054: {
        "ID": "1054",
        "Skill_Name": "Slag-Forged_Walls",
        "Resource": "Metal",
        "Type": "Yield",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Slag-Forged_Walls",
        "Interface_Display": "SKILL_1054_DESC",
        "Buff_Type": "BUFF"
    },
    1055: {
        "ID": "1055",
        "Skill_Name": "Blood-Fueled_Forge",
        "Resource": "Metal",
        "Type": "Cap",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Blood-Fueled_Forge",
        "Interface_Display": "SKILL_1055_DESC",
        "Buff_Type": "BUFF"
    },
    1056: {
        "ID": "1056",
        "Skill_Name": "Magma_Cooling_Pits",
        "Resource": "Metal",
        "Type": "Cap",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Magma_Cooling_Pits",
        "Interface_Display": "SKILL_1056_DESC",
        "Buff_Type": "BUFF"
    },
    1057: {
        "ID": "1057",
        "Skill_Name": "Mimic_Vault",
        "Resource": "Metal",
        "Type": "Cap",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Mimic_Vault",
        "Interface_Display": "SKILL_1057_DESC",
        "Buff_Type": "BUFF"
    },
    1058: {
        "ID": "1058",
        "Skill_Name": "Obsidian_Golems",
        "Resource": "Metal",
        "Type": "Cap",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Obsidian_Golems",
        "Interface_Display": "SKILL_1058_DESC",
        "Buff_Type": "BUFF"
    },
    1059: {
        "ID": "1059",
        "Skill_Name": "Void_Magnetism",
        "Resource": "Metal",
        "Type": "Cap",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Void_Magnetism",
        "Interface_Display": "SKILL_1059_DESC",
        "Buff_Type": "BUFF"
    },
    1100: {
        "ID": "1100",
        "Skill_Name": "Abyssal_Resonance",
        "Resource": "Gem",
        "Type": "Yield",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Abyssal_Resonance",
        "Interface_Display": "SKILL_1100_DESC",
        "Buff_Type": "BUFF"
    },
    1101: {
        "ID": "1101",
        "Skill_Name": "Crystal_Corruption",
        "Resource": "Gem",
        "Type": "Yield",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Crystal_Corruption",
        "Interface_Display": "SKILL_1101_DESC",
        "Buff_Type": "BUFF"
    },
    1102: {
        "ID": "1102",
        "Skill_Name": "Demon_Pickaxe",
        "Resource": "Gem",
        "Type": "Yield",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Demon_Pickaxe",
        "Interface_Display": "SKILL_1102_DESC",
        "Buff_Type": "BUFF"
    },
    1103: {
        "ID": "1103",
        "Skill_Name": "Gem_Golem",
        "Resource": "Gem",
        "Type": "Yield",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Gem_Golem",
        "Interface_Display": "SKILL_1103_DESC",
        "Buff_Type": "BUFF"
    },
    1104: {
        "ID": "1104",
        "Skill_Name": "Gluttonous_Maw",
        "Resource": "Gem",
        "Type": "Yield",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Gluttonous_Maw",
        "Interface_Display": "SKILL_1104_DESC",
        "Buff_Type": "BUFF"
    },
    1105: {
        "ID": "1105",
        "Skill_Name": "Acid_Corrosion",
        "Resource": "Gem",
        "Type": "Cap",
        "Bonus_Multiplier": 0.1,
        "Skill_Icon": "Acid_Corrosion",
        "Interface_Display": "SKILL_1105_DESC",
        "Buff_Type": "BUFF"
    },
    1106: {
        "ID": "1106",
        "Skill_Name": "Crystal_Shrine",
        "Resource": "Gem",
        "Type": "Cap",
        "Bonus_Multiplier": 0.2,
        "Skill_Icon": "Crystal_Shrine",
        "Interface_Display": "SKILL_1106_DESC",
        "Buff_Type": "BUFF"
    },
    1107: {
        "ID": "1107",
        "Skill_Name": "Dragon's_Hoard",
        "Resource": "Gem",
        "Type": "Cap",
        "Bonus_Multiplier": 0.3,
        "Skill_Icon": "Dragon's_Hoard",
        "Interface_Display": "SKILL_1107_DESC",
        "Buff_Type": "BUFF"
    },
    1108: {
        "ID": "1108",
        "Skill_Name": "Soul_Crystallization",
        "Resource": "Gem",
        "Type": "Cap",
        "Bonus_Multiplier": 0.4,
        "Skill_Icon": "Soul_Crystallization",
        "Interface_Display": "SKILL_1108_DESC",
        "Buff_Type": "BUFF"
    },
    1109: {
        "ID": "1109",
        "Skill_Name": "Void_Pouch",
        "Resource": "Gem",
        "Type": "Cap",
        "Bonus_Multiplier": 0.5,
        "Skill_Icon": "Void_Pouch",
        "Interface_Display": "SKILL_1109_DESC",
        "Buff_Type": "BUFF"
    }
};
