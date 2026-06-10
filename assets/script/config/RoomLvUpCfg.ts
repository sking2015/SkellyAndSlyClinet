/** 自动生成 TS 配置 */

export interface IRoomLvUpCfg {
    readonly Level: number;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
    readonly Cost_lumber: number;
}

export const RoomLvUpCfgData: Record<string | number, IRoomLvUpCfg> = {
    1: {
        "Level": 1,
        "Cost_Gold": 0,
        "Cost_Metal": 0,
        "Cost_lumber": 0
    },
    2: {
        "Level": 2,
        "Cost_Gold": 50000,
        "Cost_Metal": 38000,
        "Cost_lumber": 50000
    },
    3: {
        "Level": 3,
        "Cost_Gold": 400000,
        "Cost_Metal": 300000,
        "Cost_lumber": 400000
    },
    4: {
        "Level": 4,
        "Cost_Gold": 1500000,
        "Cost_Metal": 1100000,
        "Cost_lumber": 1500000
    },
    5: {
        "Level": 5,
        "Cost_Gold": 6000000,
        "Cost_Metal": 4500000,
        "Cost_lumber": 6000000
    },
    6: {
        "Level": 6,
        "Cost_Gold": 15000000,
        "Cost_Metal": 11200000,
        "Cost_lumber": 15000000
    },
    7: {
        "Level": 7,
        "Cost_Gold": 40000000,
        "Cost_Metal": 30000000,
        "Cost_lumber": 40000000
    },
    8: {
        "Level": 8,
        "Cost_Gold": 90000000,
        "Cost_Metal": 67500000,
        "Cost_lumber": 90000000
    },
    9: {
        "Level": 9,
        "Cost_Gold": 180000000,
        "Cost_Metal": 135000000,
        "Cost_lumber": 180000000
    }
};
