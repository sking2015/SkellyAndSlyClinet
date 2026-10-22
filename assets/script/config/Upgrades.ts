/** 自动生成 TS 配置 */

export interface IUpgrades {
    readonly BaseUnitID: number;
    readonly Level: number;
    readonly Cost_Gold: number;
    readonly Cost_Gem: number;
    readonly HP: number;
    readonly Attack: number;
    readonly Defense: number;
    readonly SpriteName: string;
}

export const UpgradesData: Record<string | number, IUpgrades> = {
    1001: {
        "BaseUnitID": 1001,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 450,
        "Attack": 30,
        "Defense": 60,
        "SpriteName": "spr_guard_lvl1"
    },
    1002: {
        "BaseUnitID": 1002,
        "Level": 2,
        "Cost_Gold": 10000,
        "Cost_Gem": 1000,
        "HP": 600,
        "Attack": 40,
        "Defense": 80,
        "SpriteName": "spr_guard_lvl2"
    },
    1003: {
        "BaseUnitID": 1003,
        "Level": 3,
        "Cost_Gold": 25000,
        "Cost_Gem": 3000,
        "HP": 800,
        "Attack": 55,
        "Defense": 110,
        "SpriteName": "spr_guard_lvl3"
    },
    1011: {
        "BaseUnitID": 1011,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 200,
        "Attack": 55,
        "Defense": 20,
        "SpriteName": "spr_archer_lvl1"
    },
    1012: {
        "BaseUnitID": 1012,
        "Level": 2,
        "Cost_Gold": 12000,
        "Cost_Gem": 1500,
        "HP": 280,
        "Attack": 80,
        "Defense": 30,
        "SpriteName": "spr_archer_lvl2"
    },
    1013: {
        "BaseUnitID": 1013,
        "Level": 3,
        "Cost_Gold": 30000,
        "Cost_Gem": 4000,
        "HP": 400,
        "Attack": 115,
        "Defense": 45,
        "SpriteName": "spr_archer_lvl3"
    },
    1021: {
        "BaseUnitID": 1021,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 150,
        "Attack": 95,
        "Defense": 10,
        "SpriteName": "spr_mage_lvl1"
    },
    1022: {
        "BaseUnitID": 1022,
        "Level": 2,
        "Cost_Gold": 20000,
        "Cost_Gem": 2500,
        "HP": 220,
        "Attack": 140,
        "Defense": 15,
        "SpriteName": "spr_mage_lvl2"
    },
    1023: {
        "BaseUnitID": 1023,
        "Level": 3,
        "Cost_Gold": 50000,
        "Cost_Gem": 6000,
        "HP": 320,
        "Attack": 210,
        "Defense": 25,
        "SpriteName": "spr_mage_lvl3"
    }
};
