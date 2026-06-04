
//房间类型
export enum eRoomType {
    ertNone = 0, // 无
    ertLumberMill = 1,  // 伐木场
    ertMetalWorkshop = 2,   // 金属工坊
    ertCrystalMine = 3      // 水晶矿
}

//矿场增益类型
export enum eMineBuffType {
    embtNone = 0, // 无
    embtAcceleration = 1, // 生产加速
    embtExpansion = 2, // 扩容
    embtSupervisor = 3 // 监管
}

//监工类型
export enum eOverseerType {
    eotNone = 0,
    eotEyetyarnt = 1,               //独眼巨人
    eotLich = 2,                  //巫妖
    eotOrc = 3,                      //兽人
    eotUnknown2 = 4,                 //占位
    eotMax = 5                      //最大数量
}

//监工类型
export enum eWorkerType {
    ewtNone = 0,
    ewtMiner = 1,               //矿工
    ewtWood = 2,                //木匠
}




