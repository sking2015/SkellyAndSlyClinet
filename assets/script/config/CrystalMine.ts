/** 自动生成 TS 配置 */

export interface ICrystalMine {
    readonly Level: number;
    readonly Name: string;
    readonly ResType: string;
    readonly FixedOutput: number;
    readonly ProducePer5Sec: number;
    readonly Hourly_resource: number;
    readonly MaxCapacity: number;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
    readonly Cost_lumber: number;
}

export const CrystalMineData: Record<string | number, ICrystalMine> = {
    1: {
        "Level": 1,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 0,
        "ProducePer5Sec": 50,
        "Hourly_resource": 36000,
        "MaxCapacity": 300000,
        "Cost_Gold": 0,
        "Cost_Metal": 0,
        "Cost_lumber": 0
    },
    2: {
        "Level": 2,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 115000,
        "ProducePer5Sec": 80,
        "Hourly_resource": 57600,
        "MaxCapacity": 500000,
        "Cost_Gold": 50000,
        "Cost_Metal": 38000,
        "Cost_lumber": 50000
    },
    3: {
        "Level": 3,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 185000,
        "ProducePer5Sec": 130,
        "Hourly_resource": 93600,
        "MaxCapacity": 1000000,
        "Cost_Gold": 400000,
        "Cost_Metal": 300000,
        "Cost_lumber": 400000
    },
    4: {
        "Level": 4,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 300000,
        "ProducePer5Sec": 210,
        "Hourly_resource": 151200,
        "MaxCapacity": 2000000,
        "Cost_Gold": 1500000,
        "Cost_Metal": 1100000,
        "Cost_lumber": 1500000
    },
    5: {
        "Level": 5,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 490000,
        "ProducePer5Sec": 340,
        "Hourly_resource": 244800,
        "MaxCapacity": 4000000,
        "Cost_Gold": 6000000,
        "Cost_Metal": 4500000,
        "Cost_lumber": 6000000
    },
    6: {
        "Level": 6,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 790000,
        "ProducePer5Sec": 550,
        "Hourly_resource": 396000,
        "MaxCapacity": 7500000,
        "Cost_Gold": 15000000,
        "Cost_Metal": 11200000,
        "Cost_lumber": 15000000
    },
    7: {
        "Level": 7,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 1300000,
        "ProducePer5Sec": 900,
        "Hourly_resource": 648000,
        "MaxCapacity": 15000000,
        "Cost_Gold": 40000000,
        "Cost_Metal": 30000000,
        "Cost_lumber": 40000000
    },
    8: {
        "Level": 8,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 2100000,
        "ProducePer5Sec": 1450,
        "Hourly_resource": 1044000,
        "MaxCapacity": 25000000,
        "Cost_Gold": 90000000,
        "Cost_Metal": 67500000,
        "Cost_lumber": 90000000
    },
    9: {
        "Level": 9,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 3400000,
        "ProducePer5Sec": 2350,
        "Hourly_resource": 1692000,
        "MaxCapacity": 42500000,
        "Cost_Gold": 180000000,
        "Cost_Metal": 135000000,
        "Cost_lumber": 180000000
    }
};
