import { eSkillTargetType, eBattleCamp, eSkillActionType } from "../BaseDef";
import { CBattleRole } from "../character/battlerole";
import { CCharactersManager } from "../CharacaterMannager";
import { CCharacter } from "../character/character";
import { ISkillsCfg } from "../config/SkillsCfg";

// 施放时的数值快照，飞行物命中时不依赖施法者的当前技能。
export interface ISkillEffectData {
    readonly skillType: number;
    readonly power: number;
}

//技能基类,所有技能从此派生
export class CSkillBase {
    config: ISkillsCfg = null;
    private effectData: ISkillEffectData = null;
    eTarType: eSkillTargetType = eSkillTargetType.estNone;

    caster: CBattleRole = null;

    nCD: number = 3000;

    nLastCastTime: number = 0;

    //技能范围
    nSkillRange: number = 0;

    //技能目标
    target: CCharacter = null;

    //距离上是否可以释放
    bCastByDistance: boolean = false;

    //是否为大招，大招就是要表现一下
    bIsUltimate: boolean = false;

    //技能允许伤害目标上限,一个的话就是单体技能
    nTargetsLimit: number = 1;

    arrTargets: CCharacter[] = [];


    constructor(caster: CBattleRole) {
        this.caster = caster;
    }

    Init() {
    }

    LoadData(cfg: ISkillsCfg) {
        this.config = cfg;
        this.nSkillRange = cfg.SkillRange;
        this.nCD = cfg.CoolDown * 1000; // 配置单位为秒，运行时使用毫秒。
        this.bIsUltimate = cfg.IsUltimate > 0;
        this.nTargetsLimit = cfg.TargetsLimit;
    }

    //是否范围生效
    IsRangeAffect(): boolean {
        return this.nTargetsLimit > 1;
    }

    IsCoolDown(): boolean {
        return Date.now() - this.nLastCastTime >= this.nCD;
    }

    setCaster(role: CBattleRole) {
        this.caster = role;
    }

    hasTarget(): boolean {
        return this.target != null;
    }

    getTargetCamp(): eBattleCamp {
        const eCamp: eBattleCamp = this.caster.getBattleCamp();
        let eRet: eBattleCamp = eBattleCamp.ebcNone;
        switch (this.eTarType) {
            case eSkillTargetType.estSelf:
            case eSkillTargetType.estAlly:
                eRet = eCamp;
                break;
            case eSkillTargetType.estEnemies:
                if (eCamp == eBattleCamp.ebcDemon) {
                    eRet = eBattleCamp.ebcHero;
                } else {
                    eRet = eBattleCamp.ebcDemon;
                }
                break;
            case eSkillTargetType.estAll:
                eRet = eBattleCamp.ebcAll;
                break;
        }

        return eRet;
    }

    //如果是范围内伤害，确认范围内有无目标
    onConfirmTargets() {
        this.arrTargets = CCharactersManager.instance.GetCharsByRange(this.caster, this.getTargetCamp(), this.nSkillRange)
            .slice(0, this.nTargetsLimit);
    }

    OnSelectTarget() {
        this.target = this.SearchNearestTarget();
    }

    SearchNearestTarget(): CCharacter {
        return CCharactersManager.instance.FindNearestChar(this.caster, this.getTargetCamp());
    }

    SearchLowestHPTarget(): CCharacter {
        return CCharactersManager.instance.FindLowestHPChar(this.caster, this.getTargetCamp());
    }


    OnCheckTargetDistance() {
        this.bCastByDistance = false;
        if (this.target) {
            const distance = this.caster.getDistance(this.target);
            // console.log("看一下距离", distance, this, this.nSkillRange);
            this.bCastByDistance = distance <= this.nSkillRange;
        }
    }

    IsCanCastByDistance(): boolean {
        return this.bCastByDistance;
    }

    doCast(cb?: Function) {
        this.effectData = this.CreateEffectData();
        this.nLastCastTime = Date.now();
        // console.log("释放技能,开始冷却...");
    }

    private CreateEffectData(): ISkillEffectData {
        let power = this.config.BaseData;
        switch (this.config.SkillType) {
            case eSkillActionType.esatPyhsisc:
                power += this.caster.ATK;
                break;
            case eSkillActionType.esatMagic:
                power += this.caster.INT;
                break;
            // 直接类型使用 BaseData，不附加攻击或智力。
        }
        return { skillType: this.config.SkillType, power };
    }

    GetEffectData(): ISkillEffectData {
        return this.effectData || this.CreateEffectData();
    }

    LauncheMissile() {

    }

    OnAnimationHit() {
    }

    hasValidTarget(): boolean {
        return this.target && this.target.getInBattle() && this.target.IsAlive();
    }

    //是否需要技能施放者执行技能tick
    NeedTick(): boolean {
        return false;
    }

    Tick() {

    }

    // 离开战斗时清理目标，保留技能冷却。
    CancelCast() {
        this.target = null;
        this.arrTargets = [];
        this.bCastByDistance = false;
    }
}
