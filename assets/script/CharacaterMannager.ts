import { Prefab, instantiate, isValid } from 'cc';
import { CCharacter } from './character/character';
import { CResManager } from './ResManager';
import { eCCharacterID, eBattleCamp } from './BaseDef';
import { CBaseRoom } from './room/BaseRoom';
import { CBattleFormation } from './BattleFormation';


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
    private formations = new Set<CBattleFormation>();

    registerFormation(formation: CBattleFormation) { this.formations.add(formation); }
    unregisterFormation(formation: CBattleFormation) { this.formations.delete(formation); }




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
        for (const formation of this.formations) {
            if (formation.room.index === roomIndex) formation.dispose();
        }
        const chars = this.mapCharInRoom.get(roomIndex)?.getAllChars() || [];
        for (const char of chars) this.DeleteCharater(char);
        this.mapCharInRoom.delete(roomIndex);
    }

    hasLivingEnemy(src: CCharacter, camp: eBattleCamp): boolean {
        return Array.from(this.formations).some(formation => formation.room === src.getRoom() &&
            formation.camp === camp && formation.hasForces()) || this.getRoomCharacters(src.getRoom().index)
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
        let nearest: number = Infinity;
        let target: CCharacter = null;


        for (let i = 0; i < chars.length; ++i) {
            let char: CCharacter = chars[i];
            if (char.node && isValid(char.node) && char.node.activeInHierarchy && char.getInBattle() && char.IsAlive() && (eCamp == eBattleCamp.ebcAll || char.getBattleCamp() == eCamp)) {

                // 战线顺序由中心位置决定，不能因后排体型更大而越过前排。
                let distance = Math.abs(src.getPosition() - char.getPosition());

                if (distance < nearest) {
                    target = char;
                    nearest = distance;
                }
            }
        }

        return target;
    }

    // 一维战场：返回运动线段上首先接触的存活敌人，忽略视觉高度。
    getFirstEnemyOnPath(src: CCharacter, startX: number, endX: number, padding = 0): CCharacter {
        const direction = endX >= startX ? 1 : -1;
        let first: CCharacter = null;
        let nearest = Infinity;
        for (const char of this.getRoomCharacters(src.getRoom().index)) {
            if (!char.IsAlive() || !char.getInBattle() || char.getBattleCamp() === src.getBattleCamp()) continue;
            const half = char.getRoleHalfWidth() + padding;
            const far = (char.getPosition() + direction * half - startX) * direction;
            if (far < 0) continue;
            // 先确定战线上的第一人，再判断是否到达其身体边缘；后排的大体型不能抢占前排。
            const distance = Math.max(0, (char.getPosition() - startX) * direction);
            if (distance < nearest) {
                nearest = distance;
                first = char;
            }
        }
        if (!first) return null;
        const contact = (first.getPosition() - direction * (first.getRoleHalfWidth() + padding) - startX) * direction;
        return contact <= Math.abs(endX - startX) ? first : null;
    }

    getBlockedPosition(src: CCharacter, endX: number): number {
        const start = src.getPosition();
        if (start === endX) return endX;
        const direction = endX > start ? 1 : -1;
        const blocker = this.getFirstEnemyOnPath(src, start, endX, src.getRoleHalfWidth() + 2);
        if (!blocker) return endX;
        const contact = blocker.getPosition() - direction * (src.getRoleHalfWidth() + blocker.getRoleHalfWidth() + 2);
        return direction > 0 ? Math.max(start, Math.min(endX, contact)) : Math.min(start, Math.max(endX, contact));
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
