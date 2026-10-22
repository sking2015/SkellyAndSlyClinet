/** 自动生成 TS 配置 */

export interface IMutStageCfg {
    readonly stage_level: number;
    readonly hp_cap: number;
    readonly mp_cap: number;
    readonly stat_cap: number;
    readonly req_mutation_points: number;
}

export const MutStageCfgData: Record<string | number, IMutStageCfg> = {
    0: {
        "stage_level": 0,
        "hp_cap": 1000,
        "mp_cap": 100,
        "stat_cap": 100,
        "req_mutation_points": 100
    },
    1: {
        "stage_level": 1,
        "hp_cap": 3000,
        "mp_cap": 300,
        "stat_cap": 300,
        "req_mutation_points": 500
    },
    2: {
        "stage_level": 2,
        "hp_cap": 6000,
        "mp_cap": 600,
        "stat_cap": 600,
        "req_mutation_points": 1500
    },
    3: {
        "stage_level": 3,
        "hp_cap": 9000,
        "mp_cap": 900,
        "stat_cap": 900,
        "req_mutation_points": 3000
    },
    4: {
        "stage_level": 4,
        "hp_cap": 9999,
        "mp_cap": 999,
        "stat_cap": 999,
        "req_mutation_points": 999999
    }
};
