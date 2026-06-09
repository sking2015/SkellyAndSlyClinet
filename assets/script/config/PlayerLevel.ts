/** 自动生成 TS 配置 */

export interface IPlayerLevel {
    readonly Level: number;
    readonly Exp: number;
    readonly UnlockRoom: number;
}

export const PlayerLevelData: Record<string | number, IPlayerLevel> = {
    1: {
        "Level": 1,
        "Exp": 0,
        "UnlockRoom": 1
    },
    2: {
        "Level": 2,
        "Exp": 100,
        "UnlockRoom": 2
    },
    3: {
        "Level": 3,
        "Exp": 500,
        "UnlockRoom": 3
    },
    4: {
        "Level": 4,
        "Exp": 1000,
        "UnlockRoom": 4
    },
    5: {
        "Level": 5,
        "Exp": 2000,
        "UnlockRoom": 5
    },
    6: {
        "Level": 6,
        "Exp": 5000,
        "UnlockRoom": 6
    },
    7: {
        "Level": 7,
        "Exp": 10000,
        "UnlockRoom": 0
    },
    8: {
        "Level": 8,
        "Exp": 12000,
        "UnlockRoom": 0
    },
    9: {
        "Level": 9,
        "Exp": 15000,
        "UnlockRoom": 0
    },
    10: {
        "Level": 10,
        "Exp": 20000,
        "UnlockRoom": 0
    }
};
