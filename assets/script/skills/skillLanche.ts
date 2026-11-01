import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType, eMissileId, eDirction } from "../BaseDef";
import { ISkillsCfg } from "../config/SkillsCfg";

//发射类技能，技能会发射飞行子弹脱手打击敌对目标
export class CSkillLanche extends CSkillBase {

    //技能动作
    act: string = ""
    bReadyLaunche: boolean = false;

    eMissile: eMissileId = eMissileId.emiNone;
    private launchTarget: CCharacter = null;

    Init() {
    }

    LoadData(cfg: ISkillsCfg) {
        super.LoadData(cfg);

        this.act = "attack";                //视情况不播放不同动作
        this.eTarType = eSkillTargetType.estEnemies;
        if (!Number.isInteger(cfg.AddData) || cfg.AddData <= eMissileId.emiNone ||
            eMissileId[cfg.AddData] === undefined) {
            throw new Error(`Invalid missile ID ${cfg.AddData} for skill ${cfg.ID}`);
        }
        this.eMissile = cfg.AddData; // 发射类的附加数据仅作为 eMissileId 使用。
    }


    //发射飞行物
    LauncheMissile() {
        if (this.bReadyLaunche) {
            //有可能在关键帧和动画播放完调用，但只是执行一次，所以拦一下
            this.bReadyLaunche = false;
            // 使用起手时的目标，避免 AI 后续寻敌改变弹道。
            this.caster.LauncheMissile(this.eMissile, this.launchTarget, this.GetEffectData());
            this.launchTarget = null;
        }
    }

    doCast(cb?: Function) {
        if (this.hasValidTarget()) {
            super.doCast(cb);
            // console.log("释放技能 CSkillLanuche");
            this.bReadyLaunche = true;
            this.launchTarget = this.target;

            if (this.target.getPosition() < this.caster.getPosition()) {
                this.caster.moveDirection = eDirction.edLeft;
            } else {
                this.caster.moveDirection = eDirction.edRight;
            }

            this.caster.playCastEffect();
            this.caster.play(this.act, () => {
                // console.log("技能播放完毕", this.caster);
                this.LauncheMissile();
                this.caster.SwitchToStand();
                cb ? cb() : null;
            });
        }
    }
}
