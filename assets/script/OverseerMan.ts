import { IOverseerBasicStats, OverseerBasicStatsData } from "./config/OverseerBasicStats";
import { IOverseerSkill, OverseerSkillData } from "./config/OverseerSkill";
import { CCharacterID } from "./BaseDef";
import { CResManager } from "./ResManager";
import { getI18nText } from "./i18nLan";

import * as cc from 'cc'


export enum eOSSkillType {
    est_Yield = "Yield",
    est_Cap = "Cap",
}
//监工技能数据
export class COSSkill {
    public id: string = "";
    public name: string = "";
    public sfIcon: cc.SpriteFrame = null;

    public effectTips: string = "";
    public desc: string = "";

    public cfg: IOverseerSkill;


    public nRateAdd: number = 0;
    public nCapAdd: number = 0;

    constructor(id: string) {
        this.id = id;
        this.cfg = OverseerSkillData[this.id];
        this._loadIcon();
        this._genEffectTip();
    }

    private _loadIcon() {
        this.sfIcon = CResManager.instance.getSkillIcon(this.cfg.Skill_Icon);
    }

    private _genEffectTip() {

        switch (this.cfg.Type) {
            case eOSSkillType.est_Yield:
                this.effectTips = "RATE";
                this.nRateAdd = this.cfg.Bonus_Multiplier;
                break;
            case eOSSkillType.est_Cap:
                this.effectTips = "LIMIT";
                this.nCapAdd = this.cfg.Bonus_Multiplier;
                break;
        }
        const nAddPercent: number = this.cfg.Bonus_Multiplier * 100;

        this.effectTips = `${this.effectTips} +${nAddPercent.toFixed(0)}%`;

        this.desc = getI18nText(this.cfg.Interface_Display);
        cc.log("cur effectTips", this.effectTips);
    }

    getName(): string {
        return this.cfg.Skill_Name;
    }
}

//界面需要的监工配置数据
export class COSCfgData {
    public name: string;
    public desc: string;
    public skills: COSSkill[] = [];
}



export class COverseerManager {
    constructor() {
        console.log("监工管理器，主要用于监工配置数据的读取");
    }

    private static _instance: COverseerManager = null;


    public static get instance(): COverseerManager {
        if (!COverseerManager._instance) {
            COverseerManager._instance = new COverseerManager();
        }
        return COverseerManager._instance;
    }

    getOverseerData(eot: CCharacterID): COSCfgData {
        const cfg: IOverseerBasicStats = OverseerBasicStatsData[eot];
        if (cfg) {
            const data: COSCfgData = new COSCfgData();
            data.name = cfg.OverseerName;
            data.desc = getI18nText(cfg.Description);
            if (cfg.Skill_1_ID != "0") {
                data.skills.push(new COSSkill(cfg.Skill_1_ID))
            }

            if (cfg.Skill_2_ID != "0") {
                data.skills.push(new COSSkill(cfg.Skill_2_ID))
            }

            if (cfg.Skill_3_ID != "0") {
                data.skills.push(new COSSkill(cfg.Skill_3_ID))
            }

            return data;
        }

        return null;

    }
}