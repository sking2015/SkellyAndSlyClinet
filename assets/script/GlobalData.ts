import { eOverseerType, eRoomType } from './BaseDef';

export class COverseerData {
    //类型
    eType: eOverseerType = eOverseerType.eotNone;
    //目前只有等级，如果为0表示未解锁
    level: number = 0;

    constructor(eType: eOverseerType, nLvel: number) {
        this.eType = eType;
        this.level = nLvel;
    }
}

//房间数据
export class CRoomData {
    //类型
    eType: eRoomType = eRoomType.ertNone;
    //目前只有等级，如果为0表示未解锁
    level: number = 0;

    constructor(eType: eRoomType, nLvel: number) {
        this.eType = eType;
        this.level = nLvel;
    }
}

//全局数据类，用来保存从服务器下发的数据
export class CGlobalData {
    private mapOverseer: Map<eOverseerType, COverseerData> = new Map();
    private listRooms: CRoomData[] = [];

    private nUnlockRoomNum: number = 0; // 已经解锁的房间数量

    nWood: number = 200;
    nMetal: number = 200;
    nGem: number = 200;
    nCoin: number = 1000;
    nFood: number = 200;
    nSoul: number = 200;

    constructor() {
        console.log("全局数据类开始构造");
        this.initOverseerData();
        this.initRoomsData();
    }

    private static _instance: CGlobalData = null;


    public static get instance(): CGlobalData {
        if (!CGlobalData._instance) {
            CGlobalData._instance = new CGlobalData();
        }
        return CGlobalData._instance;
    }


    //监工目前只有有限种类,所以eotWizard后面的lv都设为0
    initOverseerData() {
        for (let eType = eOverseerType.eotEyetyarnt; eType != eOverseerType.eotMax; ++eType) {
            let lv: number = 1;
            if (eType > eOverseerType.eotOrc) {
                lv = 0;
            }

            this.mapOverseer.set(eType, new COverseerData(eType, lv));
        }
    }

    //遍历所有监工
    foreachOverseers(callback: Function) {
        this.mapOverseer.forEach((data, eType) => {
            callback(data);
        })
    }

    initRoomsData() {
        //先每种房间来两个吧
        this.listRooms[0] = new CRoomData(eRoomType.ertLumberMill, 0);
        this.listRooms[1] = new CRoomData(eRoomType.ertLumberMill, 0);
        this.listRooms[2] = new CRoomData(eRoomType.ertMetalWorkshop, 0);
        this.listRooms[3] = new CRoomData(eRoomType.ertMetalWorkshop, 0);
        this.listRooms[4] = new CRoomData(eRoomType.ertGemMine, 0);
        this.listRooms[5] = new CRoomData(eRoomType.ertGemMine, 0);
    }

    foreachRooms(callback: Function) {
        for (let i = 0; i < this.listRooms.length; ++i) {
            callback(this.listRooms[i]);
        }
    }

    getUnlockRoomNum() {
        return this.nUnlockRoomNum;
    }

    unlockRoom() {
        this.nUnlockRoomNum++;
    }
}