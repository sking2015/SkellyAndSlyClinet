import { _decorator } from 'cc';
import { COverseer } from './overseer';
import { CBattleRole } from './battlerole';


const { ccclass, property } = _decorator;

//监工，主要是动作权重AI不同
@ccclass('CMonster')
export class CMonster extends CBattleRole {
}


