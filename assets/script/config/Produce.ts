/** 自动生成 TS 配置 */

export interface IProduce {
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

export const ProduceData: Record<string | number, IProduce> = {
    1001: {
        "UnitID": 1001,
        "Name": "Guard",
        "UnitClass": "Melee",
        "Cost_Gold": 50,
        "Cost_Metal": 150,
        "TrainTime": 0,
        "Base_HP": 450,
        "Base_Attack": 30,
        "Base_Defense": 60,
        "Description": "Heavy armored frontline unit. Excels at absorbing damage."
    },
    1011: {
        "UnitID": 1011,
        "Name": "Archer",
        "UnitClass": "Ranged",
        "Cost_Gold": 100,
        "Cost_Metal": 60,
        "TrainTime": 0,
        "Base_HP": 200,
        "Base_Attack": 55,
        "Base_Defense": 20,
        "Description": "Fast ranged attacker. Fragile but deadly from a distance."
    },
    1021: {
        "UnitID": 1021,
        "Name": "Mage",
        "UnitClass": "Magic",
        "Cost_Gold": 250,
        "Cost_Metal": 20,
        "TrainTime": 0,
        "Base_HP": 150,
        "Base_Attack": 95,
        "Base_Defense": 10,
        "Description": "Powerful spellcaster. High burst damage, very low defense."
    }
};
