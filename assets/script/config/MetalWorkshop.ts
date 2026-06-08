/** 自动生成 TS 配置 */

export interface IMetalWorkshop {
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

export const MetalWorkshopData: Record<string | number, IMetalWorkshop> = {
    1: {
        "Level": 1,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 0,
        "ProducePer5Sec": 75,
        "Hourly_resource": 54000,
        "MaxCapacity": 450000,
        "Cost_Gold": 0,
        "Cost_Metal": 0,
        "Cost_lumber": 0
    },
    2: {
        "Level": 2,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 170000,
        "ProducePer5Sec": 120,
        "Hourly_resource": 86400,
        "MaxCapacity": 750000,
        "Cost_Gold": 100000,
        "Cost_Metal": 8000,
        "Cost_lumber": 100000
    },
    3: {
        "Level": 3,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 280000,
        "ProducePer5Sec": 195,
        "Hourly_resource": 140400,
        "MaxCapacity": 1500000,
        "Cost_Gold": 800000,
        "Cost_Metal": 65000,
        "Cost_lumber": 800000
    },
    4: {
        "Level": 4,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 450000,
        "ProducePer5Sec": 315,
        "Hourly_resource": 226800,
        "MaxCapacity": 3000000,
        "Cost_Gold": 3000000,
        "Cost_Metal": 250000,
        "Cost_lumber": 3000000
    },
    5: {
        "Level": 5,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 730000,
        "ProducePer5Sec": 510,
        "Hourly_resource": 367200,
        "MaxCapacity": 6000000,
        "Cost_Gold": 12000000,
        "Cost_Metal": 1000000,
        "Cost_lumber": 12000000
    },
    6: {
        "Level": 6,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 1200000,
        "ProducePer5Sec": 825,
        "Hourly_resource": 594000,
        "MaxCapacity": 11500000,
        "Cost_Gold": 30000000,
        "Cost_Metal": 2500000,
        "Cost_lumber": 30000000
    },
    7: {
        "Level": 7,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 1900000,
        "ProducePer5Sec": 1350,
        "Hourly_resource": 972000,
        "MaxCapacity": 23000000,
        "Cost_Gold": 80000000,
        "Cost_Metal": 6000000,
        "Cost_lumber": 80000000
    },
    8: {
        "Level": 8,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 3100000,
        "ProducePer5Sec": 2175,
        "Hourly_resource": 1566000,
        "MaxCapacity": 38000000,
        "Cost_Gold": 180000000,
        "Cost_Metal": 13000000,
        "Cost_lumber": 180000000
    },
    9: {
        "Level": 9,
        "Name": "Metal Workshop",
        "ResType": "Metal",
        "FixedOutput": 5100000,
        "ProducePer5Sec": 3525,
        "Hourly_resource": 2538000,
        "MaxCapacity": 64000000,
        "Cost_Gold": 350000000,
        "Cost_Metal": 26000000,
        "Cost_lumber": 350000000
    }
};
