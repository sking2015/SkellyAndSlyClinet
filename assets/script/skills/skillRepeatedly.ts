import { CCharacter } from "../character/character";
import { CSkillBase } from "./skillbase";
import { eSkillTargetType } from "../BaseDef";

//多段伤害类技能，短时间内多次作用
export class CSkillRepeatedly extends CSkillBase {

    //技能动作
    actStart: string = ""
    actLoop: string = ""
    actEnd: string = ""
    Init() {
    }

    //剩余打击次数
    nLeftStrikeNum: number = 0;

    //打击次数
    nStrikeNum: number = 0;
    LoadData() {
        this.actStart = "skillstart";
        this.actLoop = "skillloop";
        this.actEnd = "skillend";

        this.eTarType = eSkillTargetType.estEnemies;
        this.nSkillRange = 330;
        this.nStrikeNum = 10;
        this.nCD = 10000;
        this.bIsUltimate = true;
    }


    StrikeOnce() {
        this.target.onHitedReady(this.caster);
        this.target.onHited(this.caster);
    }

    bInStrike: boolean = false;
    cbSkillEnd: Function = null;

    doCast(cb: Function) {
        super.doCast(cb);   //父类主要是计时开始冷却,所以需要在这里调用

        //重置打击次数
        this.nLeftStrikeNum = this.nStrikeNum;
        this.cbSkillEnd = cb;

        console.log("释放技能 CSkillRepeatedly", this.nLeftStrikeNum);
        this.caster.playSkillEffect();
        this.caster.play(this.actStart, () => {
            console.log("技能播放完毕", this.caster);
            this.caster.play(this.actLoop);
            this.bInStrike = true;
        });
    }

    doEnd() {
        this.bInStrike = false;
        this.caster.play(this.actEnd, () => {
            this.caster.SwitchToStand();
            if (this.cbSkillEnd) {
                // console.log("调用技能结束回调");
                this.cbSkillEnd();
            }
        })
    }

    NeedTick(): boolean {
        return this.bInStrike;
    }

    nInterval: number = 0;

    //每4个tick才发挥一次作用
    Tick() {
        if (this.nLeftStrikeNum > 0) {
            console.log("技能持续打击次数", this.nLeftStrikeNum);

            if (this.nInterval <= 0) {
                this.StrikeOnce()
                --this.nLeftStrikeNum;
                if (this.nLeftStrikeNum <= 0) {
                    this.doEnd();
                }
                this.nInterval = 4;
            }

            --this.nInterval;
        }


    }
}