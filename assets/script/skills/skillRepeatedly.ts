import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";

//多段伤害类技能，短时间内多次作用
export class CSkillRepeatedly extends CSkillBase {

    //技能动作
    act: string = ""
    Init() {
    }

    //剩余打击次数
    nLeftStrikeNum: number = 0;

    //打击次数
    nStrikeNum: number = 0;
    LoadData() {
        this.act = "skill";
        this.eTarType = eSkillTargetType.estEnemies;
        this.nSkillRange = 20;
        this.nStrikeNum = 10;
    }
    //只检查是否还活着
    IsValidTarget(): boolean {
        return this.target.IsAlive();
    }

    StrikeOnce() {
        this.target.onHitedReady(this.caster);
        this.target.onHited();
    }

    bInStrike: boolean = false;
    cbSkillEnd: Function = null;

    doCast(cb: Function) {
        super.doCast(cb);   //父类主要是计时开始冷却,所以需要在这里调用

        //重置打击次数
        this.nLeftStrikeNum = this.nStrikeNum;
        this.cbSkillEnd = cb;

        console.log("释放技能 CSkillOne");
        this.caster.play(this.act, () => {
            console.log("技能播放完毕", this.caster);
            this.caster.playSkillEffect();
            this.bInStrike = true;
        });
    }

    NeedTick(): boolean {
        return this.bInStrike;
    }

    nInterval: number = 0;

    //每4个tick才发挥一次作用
    Tick() {
        if (this.nLeftStrikeNum > 0) {

            if (this.nInterval <= 0) {
                this.StrikeOnce()
                --this.nLeftStrikeNum;
                if (this.nLeftStrikeNum <= 0) {
                    this.bInStrike = false;
                    this.caster.SwitchToStand();
                    if (this.cbSkillEnd) {
                        this.cbSkillEnd();
                    }
                }
                this.nInterval = 4;
            }

            --this.nInterval;
        }


    }
}