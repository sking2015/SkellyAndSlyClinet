/** 自动生成 TS 配置 */

export interface IMutEvaBonusCfg {
    readonly form_id: number;
    readonly stage_level: number;
    readonly form_type: string;
    readonly model_id: number;
    readonly bonus_hp: number;
    readonly bonus_mp: number;
    readonly bonus_atk: number;
    readonly bonus_def: number;
    readonly bonus_int: number;
    readonly bonus_mdf: number;
    readonly bonus_spd: number;
    readonly bonus_lac: number;
}

export const MutEvaBonusCfgData: Record<string | number, IMutEvaBonusCfg> = {
    101: {
        "form_id": 101,
        "stage_level": 1,
        "form_type": "Beast",
        "model_id": 1,
        "bonus_hp": 100,
        "bonus_mp": 10,
        "bonus_atk": 80,
        "bonus_def": 10,
        "bonus_int": 10,
        "bonus_mdf": 10,
        "bonus_spd": 80,
        "bonus_lac": 15
    },
    102: {
        "form_id": 102,
        "stage_level": 1,
        "form_type": "Abyss",
        "model_id": 1,
        "bonus_hp": 100,
        "bonus_mp": 80,
        "bonus_atk": 10,
        "bonus_def": 10,
        "bonus_int": 80,
        "bonus_mdf": 20,
        "bonus_spd": 10,
        "bonus_lac": 15
    },
    103: {
        "form_id": 103,
        "stage_level": 1,
        "form_type": "Flesh",
        "model_id": 1,
        "bonus_hp": 500,
        "bonus_mp": 10,
        "bonus_atk": 20,
        "bonus_def": 60,
        "bonus_int": 10,
        "bonus_mdf": 20,
        "bonus_spd": 10,
        "bonus_lac": 15
    },
    104: {
        "form_id": 104,
        "stage_level": 1,
        "form_type": "Legion",
        "model_id": 1,
        "bonus_hp": 100,
        "bonus_mp": 20,
        "bonus_atk": 10,
        "bonus_def": 10,
        "bonus_int": 10,
        "bonus_mdf": 60,
        "bonus_spd": 10,
        "bonus_lac": 100
    },
    105: {
        "form_id": 105,
        "stage_level": 1,
        "form_type": "Chaos",
        "model_id": 1,
        "bonus_hp": 300,
        "bonus_mp": 30,
        "bonus_atk": 50,
        "bonus_def": 50,
        "bonus_int": 50,
        "bonus_mdf": 50,
        "bonus_spd": 50,
        "bonus_lac": 75
    },
    201: {
        "form_id": 201,
        "stage_level": 2,
        "form_type": "Beast",
        "model_id": 2,
        "bonus_hp": 300,
        "bonus_mp": 30,
        "bonus_atk": 150,
        "bonus_def": 30,
        "bonus_int": 20,
        "bonus_mdf": 20,
        "bonus_spd": 150,
        "bonus_lac": 30
    },
    202: {
        "form_id": 202,
        "stage_level": 2,
        "form_type": "Abyss",
        "model_id": 2,
        "bonus_hp": 300,
        "bonus_mp": 150,
        "bonus_atk": 20,
        "bonus_def": 20,
        "bonus_int": 150,
        "bonus_mdf": 40,
        "bonus_spd": 20,
        "bonus_lac": 30
    },
    203: {
        "form_id": 203,
        "stage_level": 2,
        "form_type": "Flesh",
        "model_id": 2,
        "bonus_hp": 1500,
        "bonus_mp": 30,
        "bonus_atk": 40,
        "bonus_def": 120,
        "bonus_int": 20,
        "bonus_mdf": 40,
        "bonus_spd": 20,
        "bonus_lac": 30
    },
    204: {
        "form_id": 204,
        "stage_level": 2,
        "form_type": "Legion",
        "model_id": 2,
        "bonus_hp": 300,
        "bonus_mp": 50,
        "bonus_atk": 20,
        "bonus_def": 30,
        "bonus_int": 20,
        "bonus_mdf": 120,
        "bonus_spd": 20,
        "bonus_lac": 200
    },
    205: {
        "form_id": 205,
        "stage_level": 2,
        "form_type": "Chaos",
        "model_id": 2,
        "bonus_hp": 1000,
        "bonus_mp": 100,
        "bonus_atk": 100,
        "bonus_def": 100,
        "bonus_int": 100,
        "bonus_mdf": 100,
        "bonus_spd": 100,
        "bonus_lac": 150
    },
    301: {
        "form_id": 301,
        "stage_level": 3,
        "form_type": "Beast",
        "model_id": 3,
        "bonus_hp": 500,
        "bonus_mp": 50,
        "bonus_atk": 250,
        "bonus_def": 50,
        "bonus_int": 30,
        "bonus_mdf": 30,
        "bonus_spd": 250,
        "bonus_lac": 50
    },
    302: {
        "form_id": 302,
        "stage_level": 3,
        "form_type": "Abyss",
        "model_id": 3,
        "bonus_hp": 500,
        "bonus_mp": 250,
        "bonus_atk": 30,
        "bonus_def": 30,
        "bonus_int": 250,
        "bonus_mdf": 80,
        "bonus_spd": 30,
        "bonus_lac": 50
    },
    303: {
        "form_id": 303,
        "stage_level": 3,
        "form_type": "Flesh",
        "model_id": 3,
        "bonus_hp": 2500,
        "bonus_mp": 50,
        "bonus_atk": 60,
        "bonus_def": 200,
        "bonus_int": 30,
        "bonus_mdf": 60,
        "bonus_spd": 30,
        "bonus_lac": 50
    },
    304: {
        "form_id": 304,
        "stage_level": 3,
        "form_type": "Legion",
        "model_id": 3,
        "bonus_hp": 500,
        "bonus_mp": 100,
        "bonus_atk": 30,
        "bonus_def": 50,
        "bonus_int": 30,
        "bonus_mdf": 200,
        "bonus_spd": 30,
        "bonus_lac": 300
    },
    305: {
        "form_id": 305,
        "stage_level": 3,
        "form_type": "Chaos",
        "model_id": 3,
        "bonus_hp": 2000,
        "bonus_mp": 200,
        "bonus_atk": 200,
        "bonus_def": 200,
        "bonus_int": 200,
        "bonus_mdf": 200,
        "bonus_spd": 200,
        "bonus_lac": 250
    },
    401: {
        "form_id": 401,
        "stage_level": 4,
        "form_type": "Beast",
        "model_id": 4,
        "bonus_hp": 800,
        "bonus_mp": 100,
        "bonus_atk": 400,
        "bonus_def": 100,
        "bonus_int": 50,
        "bonus_mdf": 50,
        "bonus_spd": 400,
        "bonus_lac": 80
    },
    402: {
        "form_id": 402,
        "stage_level": 4,
        "form_type": "Abyss",
        "model_id": 4,
        "bonus_hp": 800,
        "bonus_mp": 400,
        "bonus_atk": 50,
        "bonus_def": 50,
        "bonus_int": 400,
        "bonus_mdf": 150,
        "bonus_spd": 50,
        "bonus_lac": 80
    },
    403: {
        "form_id": 403,
        "stage_level": 4,
        "form_type": "Flesh",
        "model_id": 4,
        "bonus_hp": 4000,
        "bonus_mp": 100,
        "bonus_atk": 100,
        "bonus_def": 300,
        "bonus_int": 50,
        "bonus_mdf": 100,
        "bonus_spd": 50,
        "bonus_lac": 80
    },
    404: {
        "form_id": 404,
        "stage_level": 4,
        "form_type": "Legion",
        "model_id": 4,
        "bonus_hp": 800,
        "bonus_mp": 150,
        "bonus_atk": 50,
        "bonus_def": 100,
        "bonus_int": 50,
        "bonus_mdf": 300,
        "bonus_spd": 50,
        "bonus_lac": 500
    },
    405: {
        "form_id": 405,
        "stage_level": 4,
        "form_type": "Chaos",
        "model_id": 4,
        "bonus_hp": 4000,
        "bonus_mp": 400,
        "bonus_atk": 350,
        "bonus_def": 350,
        "bonus_int": 350,
        "bonus_mdf": 350,
        "bonus_spd": 350,
        "bonus_lac": 400
    }
};
