/** 自动生成 TS 配置 */

export interface ITroop_Produce {
    readonly UnitID: number;
    readonly Name: string;
    readonly UnitClass: string;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
    readonly TrainTime: number;
    readonly Base_HP: number;
    readonly Base_Attack: number;
    readonly Base_Defense: number;
    readonly Description: string;
}

export const Troop_ProduceData: Record<string | number, ITroop_Produce> = {
    910: {
        "UnitID": 910,
        "Name": "Soldier",
        "UnitClass": "Melee",
        "Cost_Gold": 50,
        "Cost_Metal": 150,
        "TrainTime": 0,
        "Base_HP": 450,
        "Base_Attack": 30,
        "Base_Defense": 60,
        "Description": "Heavy armored frontline unit. Excels at absorbing damage."
    },
    911: {
        "UnitID": 911,
        "Name": "Soldier",
        "UnitClass": "Melee",
        "Cost_Gold": 100,
        "Cost_Metal": 300,
        "TrainTime": 0,
        "Base_HP": 1000,
        "Base_Attack": 60,
        "Base_Defense": 120,
        "Description": "Heavy armored frontline unit. Excels at absorbing damage."
    },
    912: {
        "UnitID": 912,
        "Name": "Soldier",
        "UnitClass": "Melee",
        "Cost_Gold": 200,
        "Cost_Metal": 500,
        "TrainTime": 0,
        "Base_HP": 2000,
        "Base_Attack": 100,
        "Base_Defense": 200,
        "Description": "Heavy armored frontline unit. Excels at absorbing damage."
    },
    920: {
        "UnitID": 920,
        "Name": "Archer",
        "UnitClass": "Far",
        "Cost_Gold": 100,
        "Cost_Metal": 60,
        "TrainTime": 0,
        "Base_HP": 200,
        "Base_Attack": 55,
        "Base_Defense": 20,
        "Description": "Fast ranged attacker. Fragile but deadly from a distance."
    },
    921: {
        "UnitID": 921,
        "Name": "Archer",
        "UnitClass": "Far",
        "Cost_Gold": 200,
        "Cost_Metal": 120,
        "TrainTime": 0,
        "Base_HP": 400,
        "Base_Attack": 100,
        "Base_Defense": 40,
        "Description": "Fast ranged attacker. Fragile but deadly from a distance."
    },
    922: {
        "UnitID": 922,
        "Name": "Archer",
        "UnitClass": "Far",
        "Cost_Gold": 300,
        "Cost_Metal": 200,
        "TrainTime": 0,
        "Base_HP": 600,
        "Base_Attack": 200,
        "Base_Defense": 60,
        "Description": "Fast ranged attacker. Fragile but deadly from a distance."
    },
    930: {
        "UnitID": 930,
        "Name": "Mage",
        "UnitClass": "Magic",
        "Cost_Gold": 250,
        "Cost_Metal": 20,
        "TrainTime": 0,
        "Base_HP": 150,
        "Base_Attack": 95,
        "Base_Defense": 10,
        "Description": "Powerful spellcaster. High burst damage, very low defense."
    },
    931: {
        "UnitID": 931,
        "Name": "Mage",
        "UnitClass": "Magic",
        "Cost_Gold": 500,
        "Cost_Metal": 50,
        "TrainTime": 0,
        "Base_HP": 300,
        "Base_Attack": 200,
        "Base_Defense": 20,
        "Description": "Powerful spellcaster. High burst damage, very low defense."
    },
    932: {
        "UnitID": 932,
        "Name": "Mage",
        "UnitClass": "Magic",
        "Cost_Gold": 800,
        "Cost_Metal": 100,
        "TrainTime": 0,
        "Base_HP": 500,
        "Base_Attack": 400,
        "Base_Defense": 30,
        "Description": "Powerful spellcaster. High burst damage, very low defense."
    }
};
