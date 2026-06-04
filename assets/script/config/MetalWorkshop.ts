/** 自动生成 TS 配置 */

export interface IMetalWorkshop {
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

export const MetalWorkshopData: Record<string | number, IMetalWorkshop> = {
    1: {
        "Level": 1,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 0,
        "ProducePerMin": 8,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 3840,
        "Cost_Gold": 600,
        "Cost_Metal": 0
    },
    2: {
        "Level": 2,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 460,
        "ProducePerMin": 12,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 5760,
        "Cost_Gold": 2700,
        "Cost_Metal": 700
    },
    3: {
        "Level": 3,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 720,
        "ProducePerMin": 19,
        "MaxAccTime_Min": 480,
        "MaxCapacity": 9120,
        "Cost_Gold": 5100,
        "Cost_Metal": 1200
    },
    4: {
        "Level": 4,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 1100,
        "ProducePerMin": 29,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 20880,
        "Cost_Gold": 9400,
        "Cost_Metal": 2100
    },
    5: {
        "Level": 5,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 1700,
        "ProducePerMin": 46,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 33120,
        "Cost_Gold": 17500,
        "Cost_Metal": 3700
    },
    6: {
        "Level": 6,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 2600,
        "ProducePerMin": 71,
        "MaxAccTime_Min": 720,
        "MaxCapacity": 51120,
        "Cost_Gold": 32500,
        "Cost_Metal": 6500
    },
    7: {
        "Level": 7,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 4100,
        "ProducePerMin": 110,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 158400,
        "Cost_Gold": 60500,
        "Cost_Metal": 11500
    },
    8: {
        "Level": 8,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 6400,
        "ProducePerMin": 170,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 244800,
        "Cost_Gold": 111500,
        "Cost_Metal": 20000
    },
    9: {
        "Level": 9,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 9900,
        "ProducePerMin": 260,
        "MaxAccTime_Min": 1440,
        "MaxCapacity": 374400,
        "Cost_Gold": 206500,
        "Cost_Metal": 35000
    }
};
