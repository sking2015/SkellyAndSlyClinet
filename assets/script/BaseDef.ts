
//房间类型
export enum eRoomType {
    ertNone = 0, // 无
    ertLumberMill = 1,  // 伐木场
    ertMetalWorkshop = 2,   // 金属工坊
    ertCrystalMine = 3,      // 水晶矿
    ertDoor = 10,            //魔王城大门
    ertAlchemy = 11,        //炼金术实验室
    ertBattleRoom = 12,        //战斗房间
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
    eciNone = 0,
    eciEyetyarnt = 1,               //独眼巨人
    eciLich = 2,                  //巫妖
    eciOrc = 3,                      //兽人
    eciDragon = 4,                 //龙
    eciTauren = 5,                  //牛头人
    eciDemonMax = 6,                 //魔王军最大数量

    eciSkullSoldier = 91,            //骷髅战士
    eciSkullArcher = 92,             //骷髅弓手    

    eciHerosStart = 100,         //勇者系ID从101开始..
    eciSoldierHM = 101,        //人类男性战士
    eciMageHF = 102,            //人类女性法师
    eciArcherEM = 103,          //精灵男性弓手
    eciPriestHF = 104,          //人类女性牧师
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
    ebcAll = 3,                  //两边均满足，用于技能
}

//技能目标类型
export enum eSkillTargetType {
    estNone = 0,
    estSelf = 1,                    //仅对自己生效
    estAlly = 2,                    //对盟友生效
    estEnemies = 3,                 //对敌人生效
    estAll = 4,                     //对战场全体生效
}

//方向定义
export enum eDirction {
    edLeft = -1,                    //向左
    edNone = 0,
    edRight = 1,                    //向向
}

//所有飞行物定义
export enum eMissileId {
    emiNone = 0,
    emiFireball = 1,                //火球
    emiArrow = 2,                    //箭矢
    emiArrowSkull = 3,              //骷髅弓手的箭矢
}

//生命状态
export enum eLifeState {
    elsNone = 0,
    elsFull = 1,                //满血
    elsHurt = 2,                //受伤(考虑主要给回血用，HP至少减少20%以上吧)
    elsDead = 3,                //死亡
    elsAny = 4                  //任意，也许有些技能不看状态全部都要选中
}

//部队类型
export enum eTroopType {
    ettNone = 0,
    ettSoldier = 1,               //近战
    ettArcher = 2,                //远程
    ettMage = 3,                  //法师
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
    readonly room_type: eRoomType;
    readonly level: number;
    readonly overseer_id: number;
    readonly guard_id: number;
    readonly storage: number;
    readonly soldier_num: number;
    readonly archer_num: number;
    readonly mage_num: number;

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




