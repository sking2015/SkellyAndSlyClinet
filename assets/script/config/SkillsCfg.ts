/** 自动生成 TS 配置 */

export interface ISkillsCfg {
    readonly ID: number;
    readonly Name: string;
    readonly SkillClass: number;
    readonly SkillRange: number;
    readonly CoolDown: number;
    readonly SkillType: number;
    readonly Cost: number;
    readonly IsUltimate: number;
    readonly TargetsLimit: number;
    readonly BaseData: number;
    readonly AddData: number;
}

export const SkillsCfgData: Record<string | number, ISkillsCfg> = {
    1001: {
        "ID": 1001,
        "Name": "基本普攻",
        "SkillClass": 1,
        "SkillRange": 5,
        "CoolDown": 3,
        "SkillType": 1,
        "Cost": 0,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 10,
        "AddData": 0
    },
    1002: {
        "ID": 1002,
        "Name": "治疗",
        "SkillClass": 2,
        "SkillRange": 500,
        "CoolDown": 5,
        "SkillType": 2,
        "Cost": 30,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 0,
        "AddData": 0
    },
    1003: {
        "ID": 1003,
        "Name": "火球术",
        "SkillClass": 4,
        "SkillRange": 500,
        "CoolDown": 5,
        "SkillType": 2,
        "Cost": 20,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 10,
        "AddData": 1
    },
    1004: {
        "ID": 1004,
        "Name": "死亡缠绕",
        "SkillClass": 4,
        "SkillRange": 500,
        "CoolDown": 5,
        "SkillType": 2,
        "Cost": 20,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 10,
        "AddData": 4
    },
    1005: {
        "ID": 1005,
        "Name": "弓术（精灵用）",
        "SkillClass": 4,
        "SkillRange": 500,
        "CoolDown": 3,
        "SkillType": 1,
        "Cost": 0,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 10,
        "AddData": 2
    },
    1006: {
        "ID": 1006,
        "Name": "弓术（骷髅用）",
        "SkillClass": 4,
        "SkillRange": 500,
        "CoolDown": 3,
        "SkillType": 1,
        "Cost": 0,
        "IsUltimate": 0,
        "TargetsLimit": 1,
        "BaseData": 10,
        "AddData": 3
    },
    9999: {
        "ID": 9999,
        "Name": "龙息",
        "SkillClass": 6,
        "SkillRange": 500,
        "CoolDown": 30,
        "SkillType": 2,
        "Cost": 100,
        "IsUltimate": 1,
        "TargetsLimit": 999,
        "BaseData": 100,
        "AddData": 0
    }
};
