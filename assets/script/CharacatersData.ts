import { Prefab } from 'cc';
import { eCCharacterID, eProperty } from './BaseDef';
import { IMonsters, MonstersData } from './config/Monsters';
import { IHeros, HerosData } from './config/Heros';
export class CCharData {
    ID: number = 0;
    Name: string = "";
    Head: string = "";
    Prefab: string = "";
    Level: number = 0;
    Race: number = 0;
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

    CostCoin: number = 0;
    CostFood: number = 0;
    CostSoul: number = 0;

    //技能和能力在数据结构上都一样，用相同数据结构
    skills: Map<number, number> = new Map();
    ability: Map<number, number> = new Map();

    properties: Map<eProperty, number> = new Map();

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
        this.Race = data.Race;
        this.Head = data.Head;
        this.Prefab = data.Prefab;

        //基础数据全部用基础数据加上等级乘以每级增量
        this.HP = data.HP + data.HPup * lv;
        this.MP = data.MP + data.MPup * lv;
        this.ATK = data.ATK + data.ATKup * lv;
        this.DEF = data.DEF + data.DEFup * lv;
        this.MDF = data.MDF + data.MDFup * lv;
        this.INT = data.INT + data.INTup * lv;
        this.SPD = data.SPD + data.SPDup * lv;
        this.LCA = data.LCA + data.LCAup * lv;

        this.properties.set(eProperty.eProHP, this.HP);
        this.properties.set(eProperty.eProMP, this.MP);
        this.properties.set(eProperty.eProATK, this.ATK);
        this.properties.set(eProperty.eProDEF, this.DEF);
        this.properties.set(eProperty.eProMDF, this.MDF);
        this.properties.set(eProperty.eProINT, this.INT);
        this.properties.set(eProperty.eProSPD, this.SPD);
        this.properties.set(eProperty.eProLCA, this.LCA);

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

        this.ResisFire = data.ResisFire;
        this.ResisIce = data.ResisIce;
        this.ResisWind = data.ResisWind;
        this.ResisThunder = data.ResisThunder;
        this.ResisDark = data.ResisDark;
        this.ResisShine = data.ResisShine;

        this.CostCoin = data.ReforgeCoin;
        this.CostFood = data.ReforgeFood;
        this.CostSoul = data.ReforgeSoul;
    }

    getProperty(e: eProperty): number {
        return this.properties.get(e);
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

    //根据id取得对应prefabpath
    GetCharPrefabPath(nID: number, bHero: boolean = false): string {

        if (bHero) {
            const cfg: IHeros = HerosData[nID];
            if (cfg) {
                return cfg.Prefab;
            }
        } else {
            const cfg: IMonsters = MonstersData[nID];
            if (cfg) {
                return cfg.Prefab;
            }
        }


        return "";
    }
}