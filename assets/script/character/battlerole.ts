import { _decorator, Component, Node } from 'cc';
import { COverseer } from './overseer';
import { eBattleCamp } from '../BaseDef';

const { ccclass, property } = _decorator;



@ccclass('CBattlerole')
export class CBattlerole extends COverseer {

    nCamp: eBattleCamp = eBattleCamp.ebcNone;

    //是否在战斗状态，对于魔王军来说，有可能是在房间巡逻或监工
    bInBattle: boolean = false;

    start() {

    }

    //战斗AI
    BattleAITick() {
    }

    AITick() {
        if (this.bInBattle) {

        } else {
            super.AITick();
        }
    }

    update(deltaTime: number) {

    }
}


