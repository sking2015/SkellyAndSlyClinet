import { Prefab, instantiate } from 'cc';
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

    mapCharInRoom: Map<number, CCharacterContainer> = new Map();

    //角色自增索引，方便角色定位
    nAutoCharIdx: number = 0;


    CreateChacater(eID: eCCharacterID): CCharacter {
        ++this.nAutoCharIdx;
        let prefabChar: Prefab = CResManager.instance.getCharPrefab(eID);
        const nodeChar = instantiate(prefabChar);
        const comChar: CCharacter = nodeChar.getComponent(CCharacter);
        comChar.index = this.nAutoCharIdx;
        this.allChars.add(comChar);
        return comChar;
    }

    //为房间创建角色，主要是放入房间列表中
    CreateChacater4room(eID: eCCharacterID, room: CBaseRoom): CCharacter {
        const char: CCharacter = this.CreateChacater(eID);
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

    ReleaseChacater(char: CCharacter) {
        this.allChars.del(char.index);
        let chars: CCharacterContainer = this.mapCharInRoom.get(char.getRoom().index);
        if (chars) {
            chars.del(char.index);
        }

        char.Release();
    }

    FindNearestChar(src: CCharacter, eCamp: eBattleCamp): CCharacter {
        let container: CCharacterContainer = this.mapCharInRoom.get(src.getRoom().index);
        let chars: CCharacter[] = container.getAllChars();
        //找出最短距离
        let nearest: number = 999;
        let target: CCharacter = null;
        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp) {
                let distance = src.getDistance(char);
                if (distance < nearest) {
                    target = char;
                }
            }
        }

        return target;
    }
}