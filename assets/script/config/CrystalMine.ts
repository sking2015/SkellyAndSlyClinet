/** 自动生成 TS 配置 */

export interface ICrystalMine {
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

export const CrystalMineData: Record<string | number, ICrystalMine> = {
    "1": {
        "Level": 1,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 0,
        "ProducePerMin": 2,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 960,
        "Cost_Gold": 2000,
        "Cost_Metal": 0
    },
    "2": {
        "Level": 2,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 75,
        "ProducePerMin": 3,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 1440,
        "Cost_Gold": 9200,
        "Cost_Metal": 2600
    },
    "3": {
        "Level": 3,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 120,
        "ProducePerMin": 4,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 1920,
        "Cost_Gold": 17000,
        "Cost_Metal": 4500
    },
    "4": {
        "Level": 4,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 180,
        "ProducePerMin": 7,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 5040,
        "Cost_Gold": 31500,
        "Cost_Metal": 8000
    },
    "5": {
        "Level": 5,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 280,
        "ProducePerMin": 11,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 7920,
        "Cost_Gold": 58500,
        "Cost_Metal": 14000
    },
    "6": {
        "Level": 6,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 440,
        "ProducePerMin": 17,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 12240,
        "Cost_Gold": 108500,
        "Cost_Metal": 24500
    },
    "7": {
        "Level": 7,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 680,
        "ProducePerMin": 27,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 38880,
        "Cost_Gold": 201000,
        "Cost_Metal": 43000
    },
    "8": {
        "Level": 8,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 1000,
        "ProducePerMin": 42,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 60480,
        "Cost_Gold": 371500,
        "Cost_Metal": 75500
    },
    "9": {
        "Level": 9,
        "Name": "Crystal Mine",
        "ResType": "Crystal",
        "FixedOutput": 1600,
        "ProducePerMin": 65,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 93600,
        "Cost_Gold": 687500,
        "Cost_Metal": 132000
    }
};
