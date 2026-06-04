/** 自动生成 TS 配置 */

export interface ILumberMill {
    readonly Level: number;
    readonly Name: string;
    readonly ResType: string;
    readonly FixedOutput: number;
    readonly ProducePerMin: number;
    readonly MaxAccTime_Min: number;
    readonly MaxCapacity: number;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
}

export const LumberMillData: Record<string | number, ILumberMill> = {
    1: {
        "Level": 1,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 0,
        "ProducePerMin": 10,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 4800,
        "Cost_Gold": 0,
        "Cost_Metal": 0
    },
    2: {
        "Level": 2,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 770,
        "ProducePerMin": 15,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 7200,
        "Cost_Gold": 1800,
        "Cost_Metal": 350
    },
    3: {
        "Level": 3,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 1200,
        "ProducePerMin": 24,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 11520,
        "Cost_Gold": 3400,
        "Cost_Metal": 610
    },
    4: {
        "Level": 4,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 1800,
        "ProducePerMin": 37,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 26640,
        "Cost_Gold": 6300,
        "Cost_Metal": 1000
    },
    5: {
        "Level": 5,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 2800,
        "ProducePerMin": 57,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 41040,
        "Cost_Gold": 11500,
        "Cost_Metal": 1800
    },
    6: {
        "Level": 6,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 4400,
        "ProducePerMin": 89,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 64080,
        "Cost_Gold": 21500,
        "Cost_Metal": 3200
    },
    7: {
        "Level": 7,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 6900,
        "ProducePerMin": 130,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 187200,
        "Cost_Gold": 40000,
        "Cost_Metal": 5700
    },
    8: {
        "Level": 8,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 10700,
        "ProducePerMin": 210,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 302400,
        "Cost_Gold": 74000,
        "Cost_Metal": 10000
    },
    9: {
        "Level": 9,
        "Name": "Lumber Mill",
        "ResType": "Lumber",
        "FixedOutput": 16500,
        "ProducePerMin": 330,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 475200,
        "Cost_Gold": 137000,
        "Cost_Metal": 17500
    }
};
