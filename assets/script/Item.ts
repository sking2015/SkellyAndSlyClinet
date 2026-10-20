import { _decorator, Component, Node } from 'cc';
import { IItemsConfig, ItemsConfigData } from './config/ItemsConfig';


export class CItem {
    public id: number = 0;
    private num: number = 0;

    public get config(): IItemsConfig {
        return ItemsConfigData[this.id];
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