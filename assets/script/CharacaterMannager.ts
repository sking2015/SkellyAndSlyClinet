import { Prefab, instantiate, isValid } from 'cc';
import { CCharacter } from './character/character';
import { CResManager } from './ResManager';
import { eCCharacterID, eBattleCamp } from './BaseDef';
import { CBaseRoom } from './room/BaseRoom';


//定义个角色容器，方便各处使用
class CCharacterContainer {
    mapChars: Map<number, CCharacter> = new Map();

    add(char: CCharacter) {
        this.mapChars.set(char.index, char);
    }

    del(index: number) {
        this.mapChars.delete(index);
    }

    clear() {
        this.mapChars.clear();
    }

    getAllChars(): CCharacter[] {
        return Array.from(this.mapChars.values());
    }
}

export class CCharactersManager {

    private static _instance: CCharactersManager = null;

    public static get instance(): CCharactersManager {
        if (!CCharactersManager._instance) {
            CCharactersManager._instance = new CCharactersManager();
        }
        return CCharactersManager._instance;
    }

    allChars: CCharacterContainer = new CCharacterContainer();

    delChars: CCharacterContainer = new CCharacterContainer();

    poolChars: CCharacterContainer = new CCharacterContainer();

    mapCharInRoom: Map<number, CCharacterContainer> = new Map();

    //角色自增索引，方便角色定位
    nAutoCharIdx: number = 0;




    AutoRelease() {
        const all = this.delChars.getAllChars();
        for (let i = 0; i < all.length; ++i) {
            this.DeleteCharater(all[i]);
            // this.poolChars.add(all[i]);
        }

        this.delChars.clear();
    }

    Tick() {
        // console.log("角色管理器tick", Date());
        this.AutoRelease();
    }


    Init() {
        setInterval(() => {
            this.Tick()
        }, 3000);
    }






    async CreateChacater(eID: eCCharacterID): Promise<CCharacter> {
        let prefabChar: Prefab = await CResManager.instance.getAsyncCharPrefab(eID);
        ++this.nAutoCharIdx;
        const nodeChar = instantiate(prefabChar);
        const comChar: CCharacter = nodeChar.getComponent(CCharacter);
        comChar.index = this.nAutoCharIdx;
        comChar.eCharId = eID;
        comChar.init();
        comChar.loadData();
        this.allChars.add(comChar);
        return comChar;
    }

    //为房间创建角色，主要是放入房间列表中
    async CreateChacater4room(eID: eCCharacterID, room: CBaseRoom): Promise<CCharacter> {
        const char: CCharacter = await this.CreateChacater(eID);
        let chars: CCharacterContainer;
        const roomIndex = room.index;
        if (this.mapCharInRoom.has(roomIndex)) {
            chars = this.mapCharInRoom.get(roomIndex);
        } else {
            chars = new CCharacterContainer();
            this.mapCharInRoom.set(roomIndex, chars);
        }

        char.setRoom(room);
        chars.add(char);

        return char;
    }

    DeleteCharater(char: CCharacter) {
        if (char.index < 0) return;
        this.allChars.del(char.index);
        this.delChars.del(char.index);
        let chars: CCharacterContainer = this.mapCharInRoom.get(char.getRoom()?.index);
        if (chars) {
            chars.del(char.index);
        }

        char.bIsAlive = false;
        char.Release();
    }

    getRoomCharacters(roomIndex: number): CCharacter[] {
        return (this.mapCharInRoom.get(roomIndex)?.getAllChars() || [])
            .filter(char => char.node && isValid(char.node) && char.node.activeInHierarchy && !char.bDelete);
    }

    clearRoomCharacters(roomIndex: number) {
        const chars = this.mapCharInRoom.get(roomIndex)?.getAllChars() || [];
        for (const char of chars) this.DeleteCharater(char);
        this.mapCharInRoom.delete(roomIndex);
    }

    hasLivingEnemy(src: CCharacter, camp: eBattleCamp): boolean {
        return this.getRoomCharacters(src.getRoom().index)
            .some(char => char.IsAlive() && char.getInBattle() && char.getBattleCamp() === camp);
    }

    ReleaseChacater(char: CCharacter) {
        char.node.active = false;
        this.delChars.add(char);
    }

    //取得距src范围内的合法目标个数
    GetCharsByRange(src: CCharacter, eCamp: eBattleCamp, nRange: number): CCharacter[] {
        let container: CCharacterContainer = this.mapCharInRoom.get(src.getRoom().index);
        let chars: CCharacter[] = container.getAllChars();
        let targets: CCharacter[] = [];
        const posSrc: number = src.getPosition();

        //范围判断要分一下左右
        if (src.IsToDirRight()) {

            const posLimit: number = src.getPosition() + nRange;
            for (let i = 0; i < chars.length; ++i) {
                let char: CCharacter = chars[i];
                if (char.node && isValid(char.node) && char.node.activeInHierarchy && char.getInBattle() && char.IsAlive() && (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp)) {
                    const posTar: number = char.getPosition();
                    //在源角色位置和目标位之间
                    if (posTar > posSrc && posTar < posLimit) {
                        targets.push(char);
                    }
                }
            }
        } else {
            const posLimit: number = src.getPosition() - nRange;
            for (let i = 0; i < chars.length; ++i) {
                let char: CCharacter = chars[i];
                if (char.node && isValid(char.node) && char.node.activeInHierarchy && char.getInBattle() && char.IsAlive() && (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp)) {
                    const posTar: number = char.getPosition();
                    //在源角色位置和目标位之间
                    if (posTar < posSrc && posTar > posLimit) {
                        targets.push(char);
                    }
                }
            }
        }

        return targets;
    }

    FindNearestChar(src: CCharacter, eCamp: eBattleCamp): CCharacter {
        let container: CCharacterContainer = this.mapCharInRoom.get(src.getRoom().index);
        let chars: CCharacter[] = container.getAllChars();
        //找出最短距离
        let nearest: number = 999;
        let target: CCharacter = null;


        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (char.node && isValid(char.node) && char.node.activeInHierarchy && char.getInBattle() && char.IsAlive() && (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp)) {

                let distance = src.getDistance(char);

                if (distance < nearest) {
                    target = char;
                    nearest = distance;
                }
            }
        }

        return target;
    }

    FindLowestHPChar(src: CCharacter, eCamp: eBattleCamp): CCharacter {

        let container: CCharacterContainer = this.mapCharInRoom.get(src.getRoom().index);
        let chars: CCharacter[] = container.getAllChars();
        //找出最短距离
        let lowestHPPer: number = 2;
        let target: CCharacter = null;


        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (char.node && isValid(char.node) && char.node.activeInHierarchy && char.getInBattle() && char.IsAlive() && (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp)) {

                const per = char.getHPPer()

                if (per < lowestHPPer) {
                    target = char;
                    lowestHPPer = per;
                }
            }
        }

        // console.log("寻找血量百分比最低单位为...", target.eCharId);
        return target;
    }


    PauseChars4Room(excepts: number[], roomIdx: number) {
        let container: CCharacterContainer = this.mapCharInRoom.get(roomIdx);
        let chars: CCharacter[] = container.getAllChars();
        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (excepts.indexOf(char.index) === -1) {
                char.doPause();
            }
        }
    }

    ResumeChars4Room(excepts: number[], roomIdx: number) {
        let container: CCharacterContainer = this.mapCharInRoom.get(roomIdx);
        let chars: CCharacter[] = container.getAllChars();
        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (excepts.indexOf(char.index) === -1) {
                char.doResuem();
            }
        }
    }
}
