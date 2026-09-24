/** 自动生成 TS 配置 */

export interface ITroop_Upgrades {
    readonly BaseUnitID: number;
    readonly Level: number;
    readonly Cost_Gold: number;
    readonly Cost_Gem: number;
    readonly HP: number;
    readonly Attack: number;
    readonly Defense: number;
    readonly SpriteName: string;
}

export const Troop_UpgradesData: Record<string | number, ITroop_Upgrades> = {
    910: {
        "BaseUnitID": 910,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 450,
        "Attack": 30,
        "Defense": 60,
        "SpriteName": "skullSoldier"
    },
    911: {
        "BaseUnitID": 911,
        "Level": 2,
        "Cost_Gold": 10000,
        "Cost_Gem": 1000,
        "HP": 600,
        "Attack": 40,
        "Defense": 80,
        "SpriteName": "skullSoldier2"
    },
    912: {
        "BaseUnitID": 912,
        "Level": 3,
        "Cost_Gold": 25000,
        "Cost_Gem": 3000,
        "HP": 800,
        "Attack": 55,
        "Defense": 110,
        "SpriteName": "skullSoldier3"
    },
    920: {
        "BaseUnitID": 920,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 200,
        "Attack": 55,
        "Defense": 20,
        "SpriteName": "skullArcher"
    },
    921: {
        "BaseUnitID": 921,
        "Level": 2,
        "Cost_Gold": 12000,
        "Cost_Gem": 1500,
        "HP": 280,
        "Attack": 80,
        "Defense": 30,
        "SpriteName": "skullArcher2"
    },
    922: {
        "BaseUnitID": 922,
        "Level": 3,
        "Cost_Gold": 30000,
        "Cost_Gem": 4000,
        "HP": 400,
        "Attack": 115,
        "Defense": 45,
        "SpriteName": "skullArcher3"
    },
    930: {
        "BaseUnitID": 930,
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Gem": 0,
        "HP": 150,
        "Attack": 95,
        "Defense": 10,
        "SpriteName": "skullMage"
    },
    931: {
        "BaseUnitID": 931,
        "Level": 2,
        "Cost_Gold": 20000,
        "Cost_Gem": 2500,
        "HP": 220,
        "Attack": 140,
        "Defense": 15,
        "SpriteName": "skullMage2"
    },
    932: {
        "BaseUnitID": 932,
        "Level": 3,
        "Cost_Gold": 50000,
        "Cost_Gem": 6000,
        "HP": 320,
        "Attack": 210,
        "Defense": 25,
        "SpriteName": "skullMage3"
    }
};
