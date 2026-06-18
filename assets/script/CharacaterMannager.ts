import { Prefab, instantiate } from 'cc';
import { CCharacter } from './character/character';
import { CResManager } from './ResManager';
import { eCCharacterID } from './BaseDef';


//定义个角色容器，方便各处使用
class CCharacterContainer {
    mapChars: Map<number, CCharacter> = new Map();

    add(char: CCharacter) {
        this.mapChars.set(char.index, char);
    }

    del(index: number) {
        this.mapChars.delete(index);
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
    CreateChacater4room(eID: eCCharacterID, roomIdx: number): CCharacter {
        const char: CCharacter = this.CreateChacater(eID);
        let chars: CCharacterContainer;
        if (this.mapCharInRoom.has(roomIdx)) {
            chars = this.mapCharInRoom.get(roomIdx);
        } else {
            chars = new CCharacterContainer();
            this.mapCharInRoom.set(roomIdx, chars);
        }

        chars.add(char);

        return char;
    }

    ReleaseChacater(char: CCharacter, roomIdx: number) {
        this.allChars.del(char.index);
        let chars: CCharacterContainer = this.mapCharInRoom.get(roomIdx);
        if (chars) {
            chars.del(char.index);
        }

        char.Release();

    }
}