import { eRoomType } from './BaseDef';

import { CrystalMineData } from './config/CrystalMine';
import { MetalWorkshopData } from './config/MetalWorkshop';
import { LumberMillData } from './config/LumberMill';
import { RoomConfigData } from './config/RoomConfig';
import { IdefaultRoomLvUpCfg, defaultRoomLvUpCfgData } from './config/defaultRoomLvUpCfg';



export interface IResData {
    readonly Level: number;
    readonly Name: string;
    readonly ResType: string;
    readonly FixedOutput: number;
    readonly ProducePer5Sec: number;
    readonly Hourly_resource: number;
    readonly MaxCapacity: number;
    readonly Cost_Gold: number;
    readonly Cost_Metal: number;
    readonly Cost_lumber: number;
}

export function getDefaultRoomLvUpCfg(level: number): IdefaultRoomLvUpCfg {
    return defaultRoomLvUpCfgData[level];

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

export function getRoomName(idx: number): string {
    return RoomConfigData[idx].RoomName;
}
