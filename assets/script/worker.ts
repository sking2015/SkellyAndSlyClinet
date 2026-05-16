import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { CCharactor, AI_INTERVAL } from './charactor';

@ccclass('worker')
export class worker extends CCharactor {
    ActionByWeightAI() {
        // 【核心动态更新规则】随着在 work 状态下时间的积累，动态调整权重
        if (this._currentActionKey === 'work') {
            // 每秒变化的速率（乘以 AI_INTERVAL 转换为单步步长）
            const workDecrease = 0.5 * AI_INTERVAL; // 工作意愿下降
            const normalIncrease = 0.2 * AI_INTERVAL; // 正常休闲意愿上升
            const tiredIncrease = 0.4 * AI_INTERVAL; // 疲劳意愿以2倍速激增

            // 1. 降低工作自身权重
            if (this._currentWeights.has('work')) {
                let w = this._currentWeights.get('work')! - workDecrease;
                this._currentWeights.set('work', Math.max(0, w));
            }

            // 2. 拔高其他休息和走动动画的权重
            this._currentWeights.forEach((weight, key) => {
                if (key === 'work') return;

                if (key === 'tried') {
                    this._currentWeights.set(key, weight + tiredIncrease);
                } else {
                    this._currentWeights.set(key, weight + normalIncrease);
                }
            });
        } else {

            const normalchange = 0.2 * AI_INTERVAL; // 正常意愿变化，当前意愿下降，其它意愿上升

            const act = this._currentActionKey;

            if (this._currentWeights.has(act)) {
                let w = this._currentWeights.get(act)! - normalchange;

                this._currentWeights.set(act, Math.max(0, w));
            }

            // 2. 拔高其他休息和走动动画的权重
            this._currentWeights.forEach((weight, key) => {
                if (key === act) return;
                if (key === 'tried') return;    //只有work增加tried

                this._currentWeights.set(key, weight + normalchange);

            });


            const workInc = 0.6 * AI_INTERVAL; // 工作意愿增加
            if (this._currentWeights.has('work')) {
                let w = this._currentWeights.get('work')! + workInc;
                this._currentWeights.set('work', Math.min(10, w));
            }

        }
    }
}


