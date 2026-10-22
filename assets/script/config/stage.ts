/** 自动生成 TS 配置 */

export interface Istage {
    readonly stage_level: number;
    readonly stage_desc: string;
    readonly hp_cap: number;
    readonly mp_cap: number;
    readonly stat_cap: number;
    readonly req_mutation_points: number;
}

export const stageData: Record<string | number, Istage> = {
    0: {
        "stage_level": 0,
        "stage_desc": "脆弱胚胎 (极易触顶)",
        "hp_cap": 1000,
        "mp_cap": 100,
        "stat_cap": 100,
        "req_mutation_points": 100
    },
    1: {
        "stage_level": 1,
        "stage_desc": "一阶形态 (流派初现)",
        "hp_cap": 3000,
        "mp_cap": 300,
        "stat_cap": 300,
        "req_mutation_points": 500
    },
    2: {
        "stage_level": 2,
        "stage_desc": "二阶形态 (深度畸变)",
        "hp_cap": 6000,
        "mp_cap": 600,
        "stat_cap": 600,
        "req_mutation_points": 1500
    },
    3: {
        "stage_level": 3,
        "stage_desc": "三阶形态 (领主雏形)",
        "hp_cap": 9000,
        "mp_cap": 900,
        "stat_cap": 900,
        "req_mutation_points": 3000
    },
    4: {
        "stage_level": 4,
        "stage_desc": "终极形态 (上限全解)",
        "hp_cap": 9999,
        "mp_cap": 999,
        "stat_cap": 999,
        "req_mutation_points": 999999
    }
};
