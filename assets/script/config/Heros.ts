/** 自动生成 TS 配置 */

export interface IHeros {
    readonly ID: number;
    readonly Name: string;
    readonly Head: string;
    readonly Portraint: string;
    readonly Prefab: string;
    readonly HP: number;
    readonly HPup: number;
    readonly MP: number;
    readonly MPup: number;
    readonly ATK: number;
    readonly ATKup: number;
    readonly DEF: number;
    readonly DEFup: number;
    readonly MDF: number;
    readonly MDFup: number;
    readonly INT: number;
    readonly INTup: number;
    readonly SPD: number;
    readonly SPDup: number;
    readonly LCA: number;
    readonly LCAup: number;
    readonly ResisFire: number;
    readonly ResisIce: number;
    readonly ResisWind: number;
    readonly ResisThunder: number;
    readonly ResisDark: number;
    readonly ResisShine: number;
    readonly Skill1: string;
    readonly Skill2: string;
    readonly Skill3: string;
    readonly Ability1: string;
    readonly Ability2: string;
    readonly Ability3: string;
    readonly Ability4: string;
    readonly Ability5: string;
    readonly Ability6: string;
    readonly Ability7: string;
    readonly Ability8: string;
    readonly Race: number;
}

export const HerosData: Record<string | number, IHeros> = {
    1: {
        "ID": 1,
        "Name": "Hero1",
        "Head": "Hero",
        "Portraint": "soldier_male",
        "Prefab": "soldier_male",
        "HP": 1000,
        "HPup": 200,
        "MP": 20,
        "MPup": 5,
        "ATK": 60,
        "ATKup": 5,
        "DEF": 80,
        "DEFup": 8,
        "MDF": 50,
        "MDFup": 5,
        "INT": 20,
        "INTup": 2,
        "SPD": 30,
        "SPDup": 1,
        "LCA": 20,
        "LCAup": 1,
        "ResisFire": 10,
        "ResisIce": 10,
        "ResisWind": 10,
        "ResisThunder": 10,
        "ResisDark": 10,
        "ResisShine": 10,
        "Skill1": "1001,1",
        "Skill2": "1002,5",
        "Skill3": "1003,10",
        "Ability1": "1001,8",
        "Ability2": "1002,20",
        "Ability3": "1003,30",
        "Ability4": "1004,40",
        "Ability5": "1005,50",
        "Ability6": "1006,60",
        "Ability7": "1007,70",
        "Ability8": "1008,80",
        "Race": 10
    },
    2: {
        "ID": 2,
        "Name": "Hero2",
        "Head": "Hero",
        "Portraint": "archer_elf_male",
        "Prefab": "mega_female",
        "HP": 500,
        "HPup": 120,
        "MP": 100,
        "MPup": 10,
        "ATK": 20,
        "ATKup": 3,
        "DEF": 50,
        "DEFup": 3,
        "MDF": 70,
        "MDFup": 8,
        "INT": 80,
        "INTup": 8,
        "SPD": 20,
        "SPDup": 1,
        "LCA": 30,
        "LCAup": 3,
        "ResisFire": 10,
        "ResisIce": 10,
        "ResisWind": 10,
        "ResisThunder": 10,
        "ResisDark": 10,
        "ResisShine": 10,
        "Skill1": "1001,1",
        "Skill2": "1002,5",
        "Skill3": "1003,10",
        "Ability1": "1001,8",
        "Ability2": "1002,20",
        "Ability3": "1003,30",
        "Ability4": "1004,40",
        "Ability5": "1005,50",
        "Ability6": "1006,60",
        "Ability7": "1007,70",
        "Ability8": "1008,80",
        "Race": 11
    },
    3: {
        "ID": 3,
        "Name": "Hero3",
        "Head": "Hero",
        "Portraint": "mega_female",
        "Prefab": "archer_elf_male",
        "HP": 800,
        "HPup": 180,
        "MP": 50,
        "MPup": 8,
        "ATK": 80,
        "ATKup": 6,
        "DEF": 60,
        "DEFup": 5,
        "MDF": 40,
        "MDFup": 6,
        "INT": 30,
        "INTup": 6,
        "SPD": 40,
        "SPDup": 1,
        "LCA": 20,
        "LCAup": 1,
        "ResisFire": 10,
        "ResisIce": 10,
        "ResisWind": 10,
        "ResisThunder": 10,
        "ResisDark": 10,
        "ResisShine": 10,
        "Skill1": "1001,1",
        "Skill2": "1002,5",
        "Skill3": "1003,10",
        "Ability1": "1001,8",
        "Ability2": "1002,20",
        "Ability3": "1003,30",
        "Ability4": "1004,40",
        "Ability5": "1005,50",
        "Ability6": "1006,60",
        "Ability7": "1007,70",
        "Ability8": "1008,80",
        "Race": 10
    },
    4: {
        "ID": 4,
        "Name": "Hero4",
        "Head": "Hero",
        "Portraint": "Hero",
        "Prefab": "priest_female",
        "HP": 2000,
        "HPup": 500,
        "MP": 100,
        "MPup": 9,
        "ATK": 100,
        "ATKup": 10,
        "DEF": 100,
        "DEFup": 10,
        "MDF": 100,
        "MDFup": 10,
        "INT": 100,
        "INTup": 10,
        "SPD": 100,
        "SPDup": 1,
        "LCA": 50,
        "LCAup": 5,
        "ResisFire": 10,
        "ResisIce": 10,
        "ResisWind": 10,
        "ResisThunder": 10,
        "ResisDark": 10,
        "ResisShine": 10,
        "Skill1": "1001,1",
        "Skill2": "1002,5",
        "Skill3": "1003,10",
        "Ability1": "1001,8",
        "Ability2": "1002,20",
        "Ability3": "1003,30",
        "Ability4": "1004,40",
        "Ability5": "1005,50",
        "Ability6": "1006,60",
        "Ability7": "1007,70",
        "Ability8": "1008,80",
        "Race": 10
    }
};
