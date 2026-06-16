import { eCCharacterID, eRoomType, IPlayer, IPlayerData, IRoom } from './BaseDef';
import { CCharData, CCharactersData } from './CharacatersData';
import { GameConfig } from './GameConfig';

//房间数据
export class CRoomData {
    //索引
    index: number = 0;
    //类型
    eType: eRoomType = eRoomType.ertNone;
    //目前只有等级，如果为0表示未解锁
    level: number = 0;

    nStock: number = 0; // 当前房间的库存量

    eOSType: eCCharacterID = eCCharacterID.eciNoe;

    // constructor(eType: eRoomType, nLvel: number) {
    //     this.eType = eType;
    //     this.level = nLvel;
    // }

    constructor(room: IRoom) {
        this.index = room.index;
        this.eType = room.room_type;
        this.level = room.level;
        this.nStock = room.storage;
        this.eOSType = room.overseer_index
    }

    load(data: IRoom) {
        this.nStock = data.storage;
        this.level = data.level;
        this.eOSType = data.overseer_index;
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
        for (let eID = eCCharacterID.eciEyetyarnt; eID != eCCharacterID.eciMax; ++eID) {
            const char: CCharData = CCharactersData.instance.GetCharData(eID, 99);
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



    initSimRoomsData() {
        //模拟数据，免得每次开服务器        
        this.listRooms[0] = new CRoomData({ index: 0, room_type: eRoomType.ertDoor, level: 0, overseer_index: 0, storage: 0 });
        this.listRooms[1] = new CRoomData({ index: 1, room_type: eRoomType.ertAlchemy, level: 0, overseer_index: 0, storage: 0 });
        this.listRooms[2] = new CRoomData({ index: 2, room_type: eRoomType.ertLumberMill, level: 0, overseer_index: 0, storage: 0 });
        this.listRooms[3] = new CRoomData({ index: 3, room_type: eRoomType.ertMetalWorkshop, level: 0, overseer_index: 0, storage: 0 });
        this.listRooms[4] = new CRoomData({ index: 4, room_type: eRoomType.ertCrystalMine, level: 0, overseer_index: 0, storage: 0 });

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

    setRoomOSTypeByIndex(idx: number, eot: eCCharacterID) {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            roomData.eOSType = eot;
        }
    }

    getRoomOSTypeByIndex(idx: number): eCCharacterID {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.eOSType;
        }

        return eCCharacterID.eciNoe;
    }

    getRoomStockByIndex(idx: number): number {
        const roomData = this.getRoomDataByIndex(idx);
        if (roomData) {
            return roomData.nStock;
        }

        return 0;
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