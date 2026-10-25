
import { CBattleData } from "./BattleData";
import { CItem } from './Item';
import { MutStageCfgData } from './config/MutStageCfg';
import { eCCharacterID, eMutationType } from './BaseDef';
import { MonstersData } from './config/Monsters';
import { MutEvaBonusCfgData } from './config/MutEvaBonusCfg';

export const FEED_ATTRIBUTES = ['HP', 'MP', 'ATK', 'DEF', 'INT', 'MDF', 'SPD', 'LCA'] as const;
export type FeedAttribute = typeof FEED_ATTRIBUTES[number];

//封装喂养数据
export class CFeedData extends CBattleData {
    public nBeastPoint: number = 0;              //狂兽指数
    public nAbyssPoint: number = 0;               //深渊指数
    public nLegionPoint: number = 0;            //统御指数
    public nFleshPoint: number = 0;              //血肉指数

    public mutPoints: number = 0;                //突变点数
    public mutLevel: number = 0;                 //突变等级
    public model_id: number = eCCharacterID.eciSkellyBase; // 当前 Monsters ID


    public mutType: eMutationType = eMutationType.emtNone;        //突变类型    



    constructor() {
        super();
        const config = MonstersData[this.model_id];
        for (const attribute of FEED_ATTRIBUTES) this[attribute] = config[attribute];
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

    public getMutationType(): eMutationType {
        const points = [
            { type: eMutationType.emtBeast, value: this.nBeastPoint },
            { type: eMutationType.emtAbyss, value: this.nAbyssPoint },
            { type: eMutationType.emtLegion, value: this.nLegionPoint },
            { type: eMutationType.emtFlesh, value: this.nFleshPoint },
        ].sort((a, b) => b.value - a.value);
        return points[0].value - points[1].value >= 20 ? points[0].type : eMutationType.emtChaos;
    }

    public getMutationConfig(level: number, type: eMutationType = this.getMutationType()) {
        return Object.keys(MutEvaBonusCfgData).map(key => MutEvaBonusCfgData[key])
            .find(config => config.stage_level === level && config.mut_type === type);
    }

    public get canMutate(): boolean {
        return !!MutStageCfgData[this.mutLevel + 1] && this.stageCfg?.req_mutation_points > 0
            && this.mutPoints >= this.stageCfg.req_mutation_points;
    }

    // 由界面在每次满槽后调用；保留剩余能量和四类累计指数。
    public mutate(): Record<FeedAttribute, number> | null {
        if (!this.canMutate) return null;
        const config = this.getMutationConfig(this.mutLevel + 1);
        if (!config || !MonstersData[config.model_id]) return null;
        this.mutPoints -= this.stageCfg.req_mutation_points;
        this.mutLevel++;
        this.mutType = config.mut_type;
        this.model_id = config.model_id;
        const changes = {} as Record<FeedAttribute, number>;
        for (const attribute of FEED_ATTRIBUTES) {
            const before = this[attribute];
            const bonus = config[`bonus_${attribute.toLowerCase()}` as keyof typeof config] as number;
            this[attribute] = Math.max(1, Math.min(this.getAttributeCap(attribute), before + bonus));
            changes[attribute] = this[attribute] - before;
        }
        this.MaxHP = this.HP;
        this.MaxMP = this.MP;
        return changes;
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
        item.itemNum--;
        return changes;
    }
}
