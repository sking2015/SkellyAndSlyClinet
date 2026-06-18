
//房间类型
export enum eRoomType {
    ertNone = 0, // 无
    ertLumberMill = 1,  // 伐木场
    ertMetalWorkshop = 2,   // 金属工坊
    ertCrystalMine = 3,      // 水晶矿
    ertDoor = 10,            //魔王城大门
    ertAlchemy = 11,        //炼金术实验室
}

//矿场增益类型
export enum eMineBuffType {
    embtNone = 0, // 无
    embtAcceleration = 1, // 生产加速
    embtExpansion = 2, // 扩容
    embtSupervisor = 3 // 监管
}

//角色ID,以后多了移到配置表
export enum eCCharacterID {
    eciNoe = 0,
    eciEyetyarnt = 1,               //独眼巨人
    eciLich = 2,                  //巫妖
    eciOrc = 3,                      //兽人
    eciDragon = 4,                 //龙
    eciMax = 5                      //最大数量
}

//种族
export enum eRace {
    erNoe = 0,
    erArchdemon = 1,               //大恶魔
    erBeast = 2,                  //魔兽
    erBoneDragon = 3,              //骨龙
    erConstruct = 4,                //造物
    erDragon = 5,                 //龙
    erGiant = 6,                    //巨人
    erSlime = 7,                    //史莱姆
    erSkull = 8,                    //骷髅
    erSpirit = 9,                   //精灵
    eciMax = 10                      //最大数量
}

//监工类型
export enum eWorkerType {
    ewtNone = 0,
    ewtMiner = 1,               //矿工
    ewtWood = 2,                //木匠
}

//角色在位置定义
export enum eCharPlace {
    ecpNone = 0,
    ecpShow = 1,                    //在展台
    ecpInRoom = 2,                  //在房间里
}


//角色属性定义
export enum eProperty {
    eProNone = "None",
    eProHP = "HP",
    eProMP = "MP",
    eProATK = "ATK",
    eProDEF = "DEF",
    eProMDF = "MDF",
    eProINT = "INT",
    eProSPD = "SPD",
    eProLCA = "LCA",
}

//战斗单位的阵营
export enum eBattleCamp {
    ebcNone = 0,
    ebcDemon = 1,               //魔王军
    ebcHero = 2,                //勇者系
}


////////////////////////
//网络交换数据定义
//////////////////////////
export interface IResources {
    readonly coin: number;
    readonly wood: number;
    readonly metal: number;
    readonly crystal: number;
    readonly food: number;
    readonly soul: number;
}

export interface IRoom {
    readonly index: number;
    readonly room_type: number;
    readonly level: number;
    readonly overseer_index: number;
    readonly storage: number;

}

export interface IPlayerData {
    readonly level: number;
    readonly overseers: any[];
    readonly rooms: IRoom[];
    readonly resources: IResources;
}

export interface IPlayer {
    readonly playerId: string;
    readonly data: IPlayerData;
    readonly token: string;
}




