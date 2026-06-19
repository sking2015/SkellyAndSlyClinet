import { eSkillTargetType, eBattleCamp } from "../BaseDef";
import { CBattleRole } from "../character/battlerole";
import { CCharactersManager } from "../CharacaterMannager";
import { CCharacter } from "../character/character";

//技能基类,所有技能从此派生
export class CSkillBase {
    eTarType: eSkillTargetType = eSkillTargetType.estNone;

    caster: CBattleRole = null;

    nCD: number = 0;

    //技能范围
    nSkillRange: number = 0;

    //技能目标
    target: CCharacter = null;

    //距离上是否可以释放
    bCastByDistance: boolean = false;


    constructor() {
        this.Init();
    }

    Init() {
    }

    GetCD(): number {
        return this.nCD;
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

    OnSelectTarget() {
        this.target = this.SearchNearestTarget();
    }

    SearchNearestTarget(): CCharacter {
        const eTarCamp: eBattleCamp = eBattleCamp.ebcNone;
        return CCharactersManager.instance.FindNearestChar(this.caster, this.getTargetCamp());
    }


    OnCheckTargetDistance() {
        const distance = this.caster.getDistance(this.target);
        this.bCastByDistance = distance < this.nSkillRange
    }

    IsCanCastByDistance(): boolean {
        return this.bCastByDistance;
    }

    doCast(cb: Function) {
        console.log("释放技能...");
    }

    IsValidTarget(): boolean {
        return true;
    }
}