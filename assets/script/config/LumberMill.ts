/** 自动生成 TS 配置 */

export interface ILumberMill {
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

export const LumberMillData: Record<string | number, ILumberMill> = {
    1: {
        "Level": 1,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 0,
        "ProducePer5Sec": 100,
        "Hourly_resource": 72000,
        "MaxCapacity": 600000,
        "Cost_Gold": 0,
        "Cost_Metal": 0,
        "Cost_lumber": 0
    },
    2: {
        "Level": 2,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 230000,
        "ProducePer5Sec": 160,
        "Hourly_resource": 115200,
        "MaxCapacity": 1000000,
        "Cost_Gold": 100000,
        "Cost_Metal": 80000,
        "Cost_lumber": 10000
    },
    3: {
        "Level": 3,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 370000,
        "ProducePer5Sec": 260,
        "Hourly_resource": 187200,
        "MaxCapacity": 2000000,
        "Cost_Gold": 800000,
        "Cost_Metal": 650000,
        "Cost_lumber": 150000
    },
    4: {
        "Level": 4,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 600000,
        "ProducePer5Sec": 420,
        "Hourly_resource": 302400,
        "MaxCapacity": 4000000,
        "Cost_Gold": 3000000,
        "Cost_Metal": 2500000,
        "Cost_lumber": 500000
    },
    5: {
        "Level": 5,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 1000000,
        "ProducePer5Sec": 680,
        "Hourly_resource": 489600,
        "MaxCapacity": 8000000,
        "Cost_Gold": 12000000,
        "Cost_Metal": 10000000,
        "Cost_lumber": 2000000
    },
    6: {
        "Level": 6,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 1600000,
        "ProducePer5Sec": 1100,
        "Hourly_resource": 792000,
        "MaxCapacity": 15000000,
        "Cost_Gold": 30000000,
        "Cost_Metal": 25000000,
        "Cost_lumber": 5000000
    },
    7: {
        "Level": 7,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 2600000,
        "ProducePer5Sec": 1800,
        "Hourly_resource": 1296000,
        "MaxCapacity": 30000000,
        "Cost_Gold": 80000000,
        "Cost_Metal": 60000000,
        "Cost_lumber": 15000000
    },
    8: {
        "Level": 8,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 4200000,
        "ProducePer5Sec": 2900,
        "Hourly_resource": 2088000,
        "MaxCapacity": 50000000,
        "Cost_Gold": 180000000,
        "Cost_Metal": 130000000,
        "Cost_lumber": 40000000
    },
    9: {
        "Level": 9,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 6800000,
        "ProducePer5Sec": 4700,
        "Hourly_resource": 3384000,
        "MaxCapacity": 85000000,
        "Cost_Gold": 350000000,
        "Cost_Metal": 260000000,
        "Cost_lumber": 90000000
    }
};
