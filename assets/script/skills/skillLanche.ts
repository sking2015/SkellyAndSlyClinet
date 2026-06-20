import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType, eMissileId } from "../BaseDef";

//发射类技能，技能会发射飞行子弹脱手打击敌对目标
export class CSkillLanche extends CSkillBase {

    //技能动作
    act: string = ""
    bReadyLaunche: boolean = false;

    eMissile: eMissileId = eMissileId.emiNone;

    Init() {
    }

    LoadData() {
        //以后这里改成读表

        this.act = "attack";                //视情况不播放不同动作
        this.eTarType = eSkillTargetType.estEnemies;
        this.nSkillRange = 500;

        this.eMissile = eMissileId.emiFireball;
    }
    //只检查是否还活着
    IsValidTarget(): boolean {
        return this.target.IsAlive();
    }

    //发射飞行物
    LauncheMissile() {
        if (this.bReadyLaunche) {
            //有可能在关键帧和动画播放完调用，但只是执行一次，所以拦一下
            this.bReadyLaunche = false;
            this.caster.LauncheMissile(this.eMissile);
        }
    }

    doCast(cb?: Function) {
        super.doCast(cb);
        console.log("释放技能 CSkillOne");
        this.bReadyLaunche = true;

        this.caster.playCastEffect();
        this.caster.play(this.act, () => {
            console.log("技能播放完毕", this.caster);
            this.LauncheMissile();
            this.caster.SwitchToStand();
            cb ? cb() : null;
        });
    }
}