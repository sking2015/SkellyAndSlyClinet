import { eCCharacterID, eRoomType, IPlayer, IPlayerData, IRoom } from './BaseDef';
import { CCharData, CCharactersData } from './CharacatersData';
import { GameConfig } from './GameConfig';
import { eTroopType } from './BaseDef';

//房间数据
//
export class CRoomData {
    //索引
    index: number = 0;
    //类型
    eType: eRoomType = eRoomType.ertNone;
    //目前只有等级，如果为0表示未解锁
    level: number = 0;

    nStock: number = 0; // 当前房间的库存量

    //监工和守卫，理论上一个房间只能有其一，所以可以合并只用一个。但为了避免岐义，还是分成两个字段，eOSId表示监工ID，eGuardId表示守卫ID 
    //监工ID，eCCharacterID.eciNone表示没有监工
    eOSId: eCCharacterID = eCCharacterID.eciNone;

    // 守卫ID，eCCharacterID.eciNone表示没有守卫
    eGuardId: eCCharacterID = eCCharacterID.eciNone;


    //如果是战斗房，需要三种部队的数量，分别是近战、远程、法术
    nSoldierNum: number = 0;
    nArcherNum: number = 0;
    nMageNum: number = 0;

    // constructor(eType: eRoomType, nLvel: number) {
    //     this.eType = eType;
    //     this.level = nLvel;
    // }

    constructor(room: IRoom) {
        this.index = room.index;
        this.eType = room.room_type;
        this.level = room.level;
        this.nStock = room.storage;
        this.eOSId = room.overseer_id;
        this.eGuardId = room.guard_id;
        this.nSoldierNum = room.soldier_num;
        this.nArcherNum = room.archer_num;
        this.nMageNum = room.mage_num;
    }

    load(data: IRoom) {
        this.nStock = data.storage;
        this.level = data.level;
        this.eOSId = data.overseer_id;
        this.eGuardId = data.guard_id;
        this.nSoldierNum = data.soldier_num;
        this.nArcherNum = data.archer_num;
        this.nMageNum = data.mage_num;
    }
}

//全局数据类，用来保存从服务器下发的数据
export class CGlobalData {
    private mapMonsters: Map<eCCharacterID, CCharData> = new Map();
    private listRooms: CRoomData[] = [];

    private nUnlockRoomNum: number = 0; // 已经解锁的房间数量

    nWood: number = 200000000;
    nMetal: number = 200000000;
    nCrystal: number = 20000000;
    nCoin: number = 1000000000;
    nFood: number = 2000000000;
    nSoul: number = 200000;

    //当前各部队容量上限
    nSoldierCapacity: number = 50;
    nArcherCapacity: number = 50;
    nMageCapacity: number = 50;

    nSoldierLeft: number = 50;
    nArcherLeft: number = 50;
    nMageLeft: number = 50;


    constructor() {
        console.log("全局数据类开始构造");
        this.initMonstersData();
        this.initSimRoomsData();
    }

    private static _instance: CGlobalData = null;


    public static get instance(): CGlobalData {
        if (!CGlobalData._instance) {
            CGlobalData._instance = new CGlobalData();
        }
        return CGlobalData._instance;
    }


    //监工目前只有有限种类,所以eotWizard后面的lv都设为0
    initMonstersData() {
        for (let eID = eCCharacterID.eciEyetyarnt; eID != eCCharacterID.eciDemonMax; ++eID) {
            const char: CCharData = CCharactersData.instance.GetCharData(eID, 0);
            this.mapMonsters.set(eID, char);
        }
    }

    //遍历所有监工
    foreachMonsters(callback: Function) {
        this.mapMonsters.forEach((data, eType) => {
            callback(data);
        })
    }

    //取得魔物等级
    getMonsterLevel(eID: eCCharacterID): number {
        const monData: CCharData = this.mapMonsters.get(eID);
        if (monData) {
            return monData.Level;
        }

        return 0;
    }

    //设置魔物等级
    setMonsterLevel(eID: eCCharacterID, level: number) {
        const monData: CCharData = this.mapMonsters.get(eID);
        if (monData) {
            monData.Level = level;
        }
    }

    loadSimRoomsData(index: number, roomType: eRoomType, level: number = 0, overseerId: eCCharacterID = eCCharacterID.eciNone, guardId: eCCharacterID = eCCharacterID.eciNone, storage: number = 0) {
        this.listRooms[index] = new CRoomData({
            index: index,
            room_type: roomType,
            level: level,
            overseer_id: overseerId,
            guard_id: guardId,
            storage: storage,
            soldier_num: 0,
            archer_num: 0,
            mage_num: 0
        });
    }

    initSimRoomsData() {
        //模拟数据，免得每次开服务器        
        this.loadSimRoomsData(0, eRoomType.ertDoor);
        this.loadSimRoomsData(1, eRoomType.ertAlchemy);
        this.loadSimRoomsData(2, eRoomType.ertLumberMill);
        this.loadSimRoomsData(3, eRoomType.ertMetalWorkshop);
        this.loadSimRoomsData(4, eRoomType.ertCrystalMine);

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

    getRoomDataByIndex(idx: number): CRoomData | null {
        if (idx < 0 || idx >= this.listRooms.length) {
            return null;
        }
        return this.listRooms[idx];
    }

    getRoomTypeByIndex(idx: number): eRoomType {
        const roomData = this.getRoomDataByIndex(idx);
        return roomData ? roomData.eType : eRoomType.ertNone;
    }

    setRoomStockByIndex(idx: number, nStock: number) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            roomData.nStock = nStock;
        }
    }

    setRoomLevelByIndex(idx: number, nLevel: number) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            roomData.level = nLevel;
        }
    }

    setRoomOSIdByIndex(idx: number, eot: eCCharacterID) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            roomData.eOSId = eot;
        }
    }

    getRoomOSIdByIndex(idx: number): eCCharacterID {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.eOSId;
        }

        return eCCharacterID.eciNone;
    }

    setRoomGuardIdByIndex(idx: number, eot: eCCharacterID) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            roomData.eGuardId = eot;
        }
    }

    getRoomGuardIdByIndex(idx: number): eCCharacterID {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.eGuardId;
        }

        return eCCharacterID.eciNone;
    }

    getRoomStockByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nStock;
        }

        return 0;
    }

    getRoomSoldierNumByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nSoldierNum;
        }

        return 0;
    }

    getRoomArcherNumByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nArcherNum;
        }
        return 0;
    }

    getRoomMageNumByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nMageNum;
        }
        return 0;
    }

    getTroopTotalNumByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nSoldierNum + roomData.nArcherNum + roomData.nMageNum;
        }
        return 0;
    }

    getSoldierCapacity(): number {
        return this.nSoldierCapacity;
    }

    getArcherCapacity(): number {
        return this.nArcherCapacity;
    }

    getMageCapacity(): number {
        return this.nMageCapacity;
    }

    getSoldierLeft(): number {
        return this.nSoldierLeft;
    }

    getArcherLeft(): number {
        return this.nArcherLeft;
    }

    getMageLeft(): number {
        return this.nMageLeft;
    }


    DeployTroop(idx: number, troopType: eTroopType, newNum: number) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            let nDiss = 0;
            switch (troopType) {
                case eTroopType.ettSoldier: //近战
                    nDiss = newNum - roomData.nSoldierNum;
                    if (nDiss > 0 && this.nSoldierLeft >= nDiss || nDiss < 0) {
                        roomData.nSoldierNum = newNum;
                        this.nSoldierLeft -= nDiss;
                    }
                    break;
                case eTroopType.ettArcher: //远程
                    nDiss = newNum - roomData.nArcherNum;
                    if (nDiss > 0 && this.nArcherLeft >= nDiss || nDiss < 0) {
                        roomData.nArcherNum = newNum;
                        this.nArcherLeft -= nDiss;
                    }
                    break;
                case eTroopType.ettMage: //法师
                    nDiss = newNum - roomData.nMageNum;
                    if (nDiss > 0 && this.nMageLeft >= nDiss || nDiss < 0) {
                        roomData.nMageNum = newNum;
                        this.nMageLeft -= nDiss;
                    }
                    break;
            }
        }
    }

    //加载数据
    loadData(data: IPlayerData) {
        if (GameConfig.ONLY_DEBUG_CLINTE) return;

        this.nCoin = data.resources.coin;
        this.nWood = data.resources.wood;
        this.nMetal = data.resources.metal;
        this.nCrystal = data.resources.crystal;
        this.nFood = data.resources.food;
        this.nSoul = data.resources.soul;

        //新加载数据重新计算解锁房间数
        this.nUnlockRoomNum = 0;
        for (let i = 0; i < data.rooms.length; ++i) {
            const rd: IRoom = data.rooms[i];
            console.log("room data", rd);
            if (this.listRooms[i]) {
                this.listRooms[i].load(rd);
            } else {
                this.listRooms[i] = new CRoomData(rd);
            }

            //如果有等级，解锁房间要加1
            if (rd.level > 0) {
                this.nUnlockRoomNum++;
            }

        }

        console.log("当前解锁房间数", this.nUnlockRoomNum);
    }
}