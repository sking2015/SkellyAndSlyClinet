import { eRoomType } from './BaseDef';

import { CrystalMineData } from './config/CrystalMine';
import { MetalWorkshopData } from './config/MetalWorkshop';
import { LumberMillData } from './config/LumberMill';

export interface IResData {
    readonly Level: number;
    readonly Name: string;
    readonly ResType: string;
    readonly FixedOutput: number;
    readonly ProducePerMin: number;
    readonly MaxAccTime_Min: number;
    readonly MaxCapacity: number;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
}

export function getResDataByRoomTypeAndLevel(eRt: eRoomType, level: number): IResData | null {
    switch (eRt) {
        case eRoomType.ertCrystalMine:
            return CrystalMineData[level];
        case eRoomType.ertLumberMill:
            return LumberMillData[level];
        case eRoomType.ertMetalWorkshop:
            return MetalWorkshopData[level];
        default:
            console.error("未知的房间类型", eRt);
            return null;
    }
}
