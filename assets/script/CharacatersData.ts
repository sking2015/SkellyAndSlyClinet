import { eCCharacterID } from './BaseDef';
import { IMonsters, MonstersData } from './config/Monsters';

export class CCharData {
    ID: number = 0;
    Name: string = "";
    Level: number = 0;
    HP: number = 0;
    MP: number = 0;
    ATK: number = 0;
    DEF: number = 0;
    MDF: number = 0;
    INT: number = 0;
    SPD: number = 0;
    LCA: number = 0;
    ResisFire: number = 0;
    ResisIce: number = 0;
    ResisWind: number = 0;
    ResisThunder: number = 0;
    ResisDark: number = 0;
    ResisShine: number = 0;

    //技能和能力在数据结构上都一样，用相同数据结构
    skills: Map<number, number> = new Map();
    ability: Map<number, number> = new Map();

    constructor(eID: eCCharacterID, level: number) {
        this.ID = eID;
        this.Level = level;
        this.calculateData();
    }


    //添加技能
    addSkillbyCfg(skillInfo: string) {
        //计算已经解锁的技能
        const skills: number[] = skillInfo.split(",").map(Number);
        let skillLevel: number = 0;

        if (this.Level >= skills[1]) {
            skillLevel = 1;
        }

        this.skills.set(skills[0], skillLevel);
    }

    //添加能力
    addAbilitybyCfg(sInfo: string) {
        //计算已经解锁的技能
        const abilityInfo: number[] = sInfo.split(",").map(Number);
        let abilityLevel: number = 0;

        if (this.Level >= abilityInfo[1]) {
            abilityLevel = 1;
        }

        this.ability.set(abilityInfo[0], abilityLevel);
    }

    //根据等级计算角色数据
    calculateData() {
        const data: IMonsters = MonstersData[this.ID];
        const lv: number = this.Level;

        this.Name = data.Name;

        //基础数据全部用基础数据加上等级乘以每级增量
        this.HP = data.HP + data.HPup * lv;
        this.MP = data.MP + data.MPup * lv;
        this.ATK = data.ATK + data.ATKup * lv;
        this.DEF = data.DEF + data.DEFup * lv;
        this.MDF = data.MDF + data.MDFup * lv;
        this.INT = data.INT + data.INTup * lv;
        this.SPD = data.SPD + data.SPDup * lv;
        this.LCA = data.LCA + data.LCAup * lv;

        this.addSkillbyCfg(data.Skill1);
        this.addSkillbyCfg(data.Skill2);
        this.addSkillbyCfg(data.Skill3);

        this.addAbilitybyCfg(data.Ability1);
        this.addAbilitybyCfg(data.Ability2);
        this.addAbilitybyCfg(data.Ability3);
        this.addAbilitybyCfg(data.Ability4);
        this.addAbilitybyCfg(data.Ability5);
        this.addAbilitybyCfg(data.Ability6);
        this.addAbilitybyCfg(data.Ability7);
        this.addAbilitybyCfg(data.Ability8);
    }
}

//
export class CCharactersData {

    private static _instance: CCharactersData = null;

    public static get instance(): CCharactersData {
        if (!CCharactersData._instance) {
            CCharactersData._instance = new CCharactersData();
        }
        return CCharactersData._instance;
    }

    GetCharData(eID: eCCharacterID, nLevel: number): CCharData {

        let dataChar: CCharData = new CCharData(eID, nLevel);
        return dataChar;
    }
}