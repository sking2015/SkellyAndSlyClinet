import { IItemFeedCfg, ItemFeedCfgData } from './config/ItemFeedCfg';
import { DropConfigData } from './config/DropConfig';

export type LootResourceType = 'Coin' | 'Food' | 'Soul';

export interface CResourceDrop {
    resourceType: LootResourceType;
    amount: number;
}

export type CLootDrop = CItem | CResourceDrop;


export class CItem {
    public id: number = 0;
    private num: number = 0;

    // public get config(): IItemsConfig {
    //     return ItemsConfigData[this.id];
    // }

    public get feedCfg(): IItemFeedCfg {
        return ItemFeedCfgData[this.id];
    }

    public get itemNum(): number {
        return this.num;
    }

    public set itemNum(value: number) {
        this.num = value;
    }
}

export class CItemManager {
    mapItems: Map<number, CItem> = new Map<number, CItem>();

    // 掉落实例与背包数据分离，收取到位前不改变已有数量。
    public static getDropItems(dropId: number): CItem[] {
        if (!dropId) return [];
        const config = DropConfigData[dropId];
        if (!config) throw new Error(`掉落配置不存在: ${dropId}`);
        const content = String(config.DropContent ?? '').trim();
        if (!content || content === 'undefined' || content === 'null' || content === '0') return [];
        return content.split(',').map(entry => {
            const pair = entry.split(':').map(Number);
            if (pair.length !== 2 || !pair.every(value => Number.isSafeInteger(value) && value > 0)
                || !ItemFeedCfgData[pair[0]]?.icon_spr) {
                throw new Error(`掉落内容无效: ${dropId}, ${entry}`);
            }
            const item = new CItem();
            item.id = pair[0];
            item.itemNum = pair[1];
            return item;
        });
    }

    public static getDrops(dropId: number): CLootDrop[] {
        const drops: CLootDrop[] = this.getDropItems(dropId);
        if (!dropId) return drops;
        const config = DropConfigData[dropId];
        for (const resourceType of ['Coin', 'Food', 'Soul'] as LootResourceType[]) {
            const amount = config[resourceType] ?? 0;
            if (!Number.isSafeInteger(amount) || amount < 0) {
                throw new Error(`资源掉落数量无效: ${dropId}, ${resourceType}: ${amount}`);
            }
            if (amount > 0) drops.push({ resourceType, amount });
        }
        return drops;
    }

    public addItem(itemId: number, num: number): CItem {
        const item = this.getItem(itemId);
        if (!item) return this.createItem(itemId, num);
        item.itemNum += num;
        return item;
    }

    public getItem(itemId: number): CItem {
        if (this.mapItems.has(itemId)) {
            return this.mapItems.get(itemId);
        }

        return null;
    }

    public createItem(itemId: number, num: number = 1): CItem {
        const item = new CItem();
        item.id = itemId;
        item.itemNum = num;

        this.mapItems.set(itemId, item);

        return item;
    }
}
