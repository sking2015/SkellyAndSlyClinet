/** 自动生成 TS 配置 */

export interface IMutLogic {
    readonly rule_id: number;
    readonly priority: number;
    readonly max_diff_threshold: number;
    readonly req_highest_gene: string;
    readonly result_form_type: string;
    readonly desc: string;
}

export const MutLogicData: Record<string | number, IMutLogic> = {
    1: {
        "rule_id": 1,
        "priority": 0,
        "max_diff_threshold": 20,
        "req_highest_gene": "ALL",
        "result_form_type": "Chaos",
        "desc": "极差<=20触发混沌"
    },
    2: {
        "rule_id": 2,
        "priority": 1,
        "max_diff_threshold": 999,
        "req_highest_gene": "Beast",
        "result_form_type": "Beast",
        "desc": "极差>20且狂兽分最高"
    },
    3: {
        "rule_id": 3,
        "priority": 1,
        "max_diff_threshold": 999,
        "req_highest_gene": "Abyss",
        "result_form_type": "Abyss",
        "desc": "极差>20且深渊分最高"
    },
    4: {
        "rule_id": 4,
        "priority": 1,
        "max_diff_threshold": 999,
        "req_highest_gene": "Legion",
        "result_form_type": "Legion",
        "desc": "极差>20且统御分最高"
    },
    5: {
        "rule_id": 5,
        "priority": 1,
        "max_diff_threshold": 999,
        "req_highest_gene": "Flesh",
        "result_form_type": "Flesh",
        "desc": "极差>20且血肉分最高"
    }
};
