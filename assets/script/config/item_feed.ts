/** 自动生成 TS 配置 */

export interface Iitem_feed {
    readonly item_id: number;
    readonly item_name: string;
    readonly icon_spr: string;
    readonly add_hp: number;
    readonly add_mp: number;
    readonly add_atk: number;
    readonly add_def: number;
    readonly add_int: number;
    readonly add_mdf: number;
    readonly add_spd: number;
    readonly add_lac: number;
    readonly gene_beast: number;
    readonly gene_abyss: number;
    readonly gene_legion: number;
    readonly gene_flesh: number;
    readonly mut_points: number;
}

export const item_feedData: Record<string | number, Iitem_feed> = {
    1001: {
        "item_id": 1001,
        "item_name": "Demon Horn",
        "icon_spr": "1001",
        "add_hp": 0,
        "add_mp": 0,
        "add_atk": 20,
        "add_def": -10,
        "add_int": 0,
        "add_mdf": 0,
        "add_spd": 20,
        "add_lac": 20,
        "gene_beast": 15,
        "gene_abyss": 0,
        "gene_legion": 0,
        "gene_flesh": -5,
        "mut_points": 10
    },
    1002: {
        "item_id": 1002,
        "item_name": "Dragon Eye",
        "icon_spr": "1002",
        "add_hp": -10,
        "add_mp": 20,
        "add_atk": 0,
        "add_def": 0,
        "add_int": 20,
        "add_mdf": 20,
        "add_spd": 0,
        "add_lac": 0,
        "gene_beast": -5,
        "gene_abyss": 15,
        "gene_legion": 0,
        "gene_flesh": 0,
        "mut_points": 10
    },
    1003: {
        "item_id": 1003,
        "item_name": "Core Rock",
        "icon_spr": "1003",
        "add_hp": 25,
        "add_mp": 0,
        "add_atk": 0,
        "add_def": 25,
        "add_int": 0,
        "add_mdf": 0,
        "add_spd": 0,
        "add_lac": 0,
        "gene_beast": 0,
        "gene_abyss": 0,
        "gene_legion": -5,
        "gene_flesh": 15,
        "mut_points": 10
    },
    1004: {
        "item_id": 1004,
        "item_name": "Flesh Mass",
        "icon_spr": "1004",
        "add_hp": 0,
        "add_mp": 25,
        "add_atk": 0,
        "add_def": 0,
        "add_int": 0,
        "add_mdf": 0,
        "add_spd": 0,
        "add_lac": 25,
        "gene_beast": 0,
        "gene_abyss": -5,
        "gene_legion": 15,
        "gene_flesh": 0,
        "mut_points": 10
    },
    8001: {
        "item_id": 8001,
        "item_name": "Robust Bone",
        "icon_spr": "8001",
        "add_hp": 0,
        "add_mp": 0,
        "add_atk": 15,
        "add_def": 0,
        "add_int": 0,
        "add_mdf": 0,
        "add_spd": 0,
        "add_lac": 0,
        "gene_beast": 5,
        "gene_abyss": 5,
        "gene_legion": 5,
        "gene_flesh": 5,
        "mut_points": 5
    },
    8002: {
        "item_id": 8002,
        "item_name": "Occult Egg",
        "icon_spr": "8002",
        "add_hp": 50,
        "add_mp": 50,
        "add_atk": 50,
        "add_def": 50,
        "add_int": 50,
        "add_mdf": 50,
        "add_spd": 50,
        "add_lac": 50,
        "gene_beast": 20,
        "gene_abyss": 20,
        "gene_legion": 20,
        "gene_flesh": 20,
        "mut_points": 50
    }
};
