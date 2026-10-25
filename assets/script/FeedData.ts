
import { CBattleData } from "./BattleData";
import { CItem } from './Item';
import { MutStageCfgData } from './config/MutStageCfg';
import { eMutationType } from './BaseDef';

export const FEED_ATTRIBUTES = ['HP', 'MP', 'ATK', 'DEF', 'INT', 'MDF', 'SPD', 'LAC'] as const;
export type FeedAttribute = typeof FEED_ATTRIBUTES[number];

//封装喂养数据
export class CFeedData extends CBattleData {
    public nBeastPoint: number = 0;              //狂兽指数
    public nAbyssPoint: number = 0;               //深渊指数
    public nLegionPoint: number = 0;            //统御指数
    public nFleshPoint: number = 0;              //血肉指数

    public mutPoints: number = 0;                //突变点数
    public mutLevel: number = 0;                 //突变等级
    public model_id: number = 0;                  //当前模型ID


    public mutType: eMutationType = eMutationType.emtNone;        //突变类型    



    constructor() {
        super();
        for (const attribute of FEED_ATTRIBUTES) this[attribute] = 1;
        this.MaxHP = this.HP;
        this.MaxMP = this.MP;
    }

    public get stageCfg() {
        return MutStageCfgData[this.mutLevel];
    }

    public getAttributeCap(attribute: FeedAttribute): number {
        const stage = this.stageCfg;
        return attribute === 'HP' ? stage.hp_cap : attribute === 'MP' ? stage.mp_cap : stage.stat_cap;
    }

    // 返回截断后的实际变化量，供界面播放反馈；失败时不消耗道具。
    public feed(item: CItem): Record<FeedAttribute, number> | null {
        const config = item?.feedCfg;
        if (!config || item.itemNum < 1 || !this.stageCfg) return null;
        const changes = {} as Record<FeedAttribute, number>;
        for (const attribute of FEED_ATTRIBUTES) {
            const before = this[attribute];
            const base = config[`add_${attribute.toLowerCase()}` as keyof typeof config] as number;
            // 在配置值的 50%～150% 区间内等概率抽取整数，负值保持减益方向。
            const min = Math.ceil(Math.min(base * 0.5, base * 1.5));
            const max = Math.floor(Math.max(base * 0.5, base * 1.5));
            const addition = min + Math.floor(Math.random() * (max - min + 1));
            this[attribute] = Math.max(1, Math.min(this.getAttributeCap(attribute), before + addition));
            changes[attribute] = this[attribute] - before;
        }
        this.MaxHP = this.HP;
        this.MaxMP = this.MP;
        this.nBeastPoint += config.gene_beast;
        this.nAbyssPoint += config.gene_abyss;
        this.nLegionPoint += config.gene_legion;
        this.nFleshPoint += config.gene_flesh;
        this.mutPoints += config.mut_points;
        while (MutStageCfgData[this.mutLevel + 1]
            && this.stageCfg.req_mutation_points > 0
            && this.mutPoints >= this.stageCfg.req_mutation_points) {
            this.mutPoints -= this.stageCfg.req_mutation_points;
            this.mutLevel++;
        }
        item.itemNum--;
        return changes;
    }
}
