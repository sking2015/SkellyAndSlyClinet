import { _decorator } from 'cc';
const { ccclass, property } = _decorator;
import { CCharacter, AI_INTERVAL } from './character';

//监工，主要是动作权重AI不同
@ccclass('CMonster')
export class CMonster extends CCharacter {
    ActionByWeightAI() {
        // 【核心动态更新规则】随着在 work 状态下时间的积累，动态调整权重

        // 每秒变化的速率（乘以 AI_INTERVAL 转换为单步步长）
        const idleIncrease = 0.05 * AI_INTERVAL; // 休闲意愿缓慢上升
        const runIncrease = 0.2 * AI_INTERVAL; // 移动意愿上升
        const standIncrease = 0.4 * AI_INTERVAL; // 正常站立意愿以快速上升


        // 循环内统一处理各权重权重，当前执行行为一律置0
        this._currentWeights.forEach((weight, key) => {
            if (this._currentActionKey == key) {
                this._currentWeights.set(key, 0);
            } else {
                let w = this._currentWeights.get(key)
                switch (key) {
                    case 'idle':
                        w += idleIncrease;
                        break;
                    case 'run':
                        w += runIncrease;
                        break;
                    case 'walk':
                        w += runIncrease;
                        break;
                    case 'stand':
                        w += standIncrease;
                        break;
                }

                this._currentWeights.set(key, w);

            }
        });

    }
}


