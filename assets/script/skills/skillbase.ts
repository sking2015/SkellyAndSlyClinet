import { eSkillTargetType, eBattleCamp } from "../BaseDef";
import { CBattleRole } from "../character/battlerole";
import { CCharactersManager } from "../CharacaterMannager";
import { CCharacter } from "../character/character";
import { ExecFileOptionsWithBufferEncoding } from "child_process";

//技能基类,所有技能从此派生
export class CSkillBase {
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

    LoadData() {
        this.nSkillRange = 30;
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
        const eTarCamp: eBattleCamp = eBattleCamp.ebcNone;
        this.arrTargets = CCharactersManager.instance.GetCharsByRange(this.caster, this.getTargetCamp(), this.nSkillRange);
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
        if (this.target) {
            const distance = this.caster.getDistance(this.target);
            // console.log("看一下距离", distance, this, this.nSkillRange);
            this.bCastByDistance = distance < this.nSkillRange;
        }
    }

    IsCanCastByDistance(): boolean {
        return this.bCastByDistance;
    }

    doCast(cb?: Function) {
        this.nLastCastTime = Date.now();
        // console.log("释放技能,开始冷却...");
    }

    LauncheMissile() {

    }

    hasValidTarget(): boolean {
        return this.target && this.target.IsAlive();
    }

    //是否需要技能施放者执行技能tick
    NeedTick(): boolean {
        return false;
    }

    Tick() {

    }
}