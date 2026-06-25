import { _decorator, Component, Node, Prefab, SpriteFrame, assetManager, AssetManager, isValid } from 'cc';
import { CCharacterCfg, CRoomType2Data, CProperty2Spriteframe, CRace2Spriteframe, CMissileId2Prefab } from './KeyValuePair';
import { eCCharacterID, eProperty, eRoomType, eRace, eMissileId } from './BaseDef';
import { CCharactersData } from './CharacatersData';
import { promises } from 'dns';

const { ccclass, property } = _decorator;


//魔物分包，由于魔物是己方单位，可能有很多基本常驻，不能一起释放。
const MONSTER_BUNDLE = "monsters";
//勇者系分包，一般战斗发生时才会出现，当战斗结束后可以将此分包内的内容一起释放
const HEROS_BUNDLE = "heros";


@ccclass('CResManager')
export class CResManager extends Component {

    // @property({ type: CCharacterCfg, tooltip: "所有角色定义" })
    // characterCfg: CCharacterCfg[] = [];


    @property({ type: CRoomType2Data, tooltip: "所有房间数据定义" })
    roomdata: CRoomType2Data[] = [];

    @property({ type: CProperty2Spriteframe, tooltip: "所有属性进度条图块定义" })
    propertyBarCfg: CProperty2Spriteframe[] = [];

    @property({ type: CRace2Spriteframe, tooltip: "所有种族图标定义" })
    raceSFCfg: CRace2Spriteframe[] = [];

    @property({ type: CMissileId2Prefab, tooltip: "所有飞行物定义" })
    missilePfb: CMissileId2Prefab[] = [];


    @property({ type: SpriteFrame, tooltip: "一些较小的图片，常用的图片在此定义并预加载" })
    sfAllImg: SpriteFrame[] = [];

    @property({ type: Prefab, tooltip: "弹出信息，主要是伤害" })
    popInfo: Prefab = null;


    private mapMonsters: Map<eCCharacterID, CCharacterCfg> = new Map();

    private mapRoomImgData: Map<eRoomType, CRoomType2Data> = new Map();

    private mapRace: Map<eRace, SpriteFrame> = new Map();


    private mapSkillsIcon: Map<string, SpriteFrame> = new Map();

    private mapMissilePrefab: Map<eMissileId, Prefab> = new Map();

    private mapAllImg: Map<string, SpriteFrame> = new Map();

    // 静态实例变量
    private static _instance: CResManager = null!;

    // 静态获取器
    public static get instance(): CResManager {
        if (!CResManager._instance) {
            console.error("CResManager 尚未初始化！请确保它被挂载到了场景的节点上。");
        }
        return CResManager._instance;
    }



    private herosBundle: AssetManager.Bundle = null;
    private monstersBundle: AssetManager.Bundle = null;

    //为了兼容以前的写法，写个异步加载的函数方便使用
    async getAsyncCharPrefab(eID: eCCharacterID): Promise<Prefab> {
        console.log("异步读取角色", eID);
        let nCharID = eID;
        let bundle: AssetManager.Bundle;
        let bHero: boolean = false;
        if (eID > eCCharacterID.eciHerosStart) {
            nCharID -= eCCharacterID.eciHerosStart;

            console.log("从herobundle读取", nCharID);
            bundle = this.herosBundle;
            bHero = true;
        } else {
            console.log("从monsterbundle读取", nCharID);
            bundle = this.monstersBundle;
        }

        const path = CCharactersData.instance.GetCharPrefabPath(nCharID, bHero);


        console.log("从bundle读取path", path);
        const prefab = await new Promise<Prefab>((resolve, reject) => {
            // 如果资源在根目录，路径传 '' 或 '.' ；如果在子目录如 'icons'，则传 'icons'
            bundle.load(path, Prefab, (err, prefab) => err ? reject(err) : resolve(prefab));
        });

        return prefab;
    }

    dynLoadHero(hero: string, cb: Function) {
        if (!this.herosBundle) {
            console.log("勇者bundle还为空，是否太早调用dynLoadHero函数")
            return;
        }

        this.herosBundle.load(hero, Prefab, (err: Error | null, prefab: Prefab) => {
            if (err) {
                console.error('Failed to load hero prefab', err);
                return;
            }

            cb(prefab);
        })
    }

    dynLoadMonster(monster: string, cb: Function) {
        if (!this.monstersBundle) {
            console.log("魔物bundle还为空，是否太早调用dynLoadMonster函数")
            return;
        }

        this.monstersBundle.load(monster, Prefab, (err: Error | null, prefab: Prefab) => {
            if (err) {
                console.error('Failed to load hero prefab', err);
                return;
            }

            cb(prefab);
        })
    }

    private _dyncLoadHerosBundle() {
        assetManager.loadBundle(HEROS_BUNDLE, (err: Error | null, bundle: AssetManager.Bundle) => {
            if (err) {
                console.error('Failed to load heros bundle:', err);
                return;
            }

            this.herosBundle = bundle;
        });
    }

    private _dyncLoadMonstersBundle() {
        assetManager.loadBundle(MONSTER_BUNDLE, (err: Error | null, bundle: AssetManager.Bundle) => {
            if (err) {
                console.error('Failed to load monsters bundle:', err);
                return;
            }

            this.monstersBundle = bundle;
        });

    }

    private async _dynLoadSkillsIcon() {
        try {
            // 步骤 A：异步加载 Bundle
            const bundle = await new Promise<AssetManager.Bundle>((resolve, reject) => {
                assetManager.loadBundle('skillsicon', (err, bdl) => err ? reject(err) : resolve(bdl));
            });

            // 异步安全检查：防止加载期间组件已被销毁
            if (!isValid(this)) return;

            console.log('Bundle 加载成功，开始读取所有 SpriteFrame...');

            // 步骤 B：批量加载 Bundle 根目录（或指定子目录）下的所有 SpriteFrame
            // 注意：3.x 中加载目录下的 SpriteFrame，路径类型要强行指定为 SpriteFrame
            const spriteFrames = await new Promise<SpriteFrame[]>((resolve, reject) => {
                // 如果资源在根目录，路径传 '' 或 '.' ；如果在子目录如 'icons'，则传 'icons'
                bundle.loadDir('', SpriteFrame, (err, assets) => err ? reject(err) : resolve(assets));
            });

            if (!isValid(this)) return;

            // 步骤 C：遍历结果，以图片名称为键存入 Map 缓存
            this.mapSkillsIcon.clear(); // 清空旧缓存
            for (const sf of spriteFrames) {
                if (sf && sf.name) {
                    this.mapSkillsIcon.set(sf.name, sf);
                    console.log(`成功缓存图标: [${sf.name}]`);
                }
            }

            console.log(`所有图标缓存完毕，共计: ${this.mapSkillsIcon.size} 个`);

        } catch (err) {
            console.error('加载或缓存图标 Bundle 失败:', err);
        }
    }

    public getPropertyBarSF(e: eProperty): SpriteFrame {
        for (let i = 0; i < this.propertyBarCfg.length; ++i) {
            if (e = this.propertyBarCfg[i].key) {
                return this.propertyBarCfg[i].value;
            }
        }

        return null;

    }


    public getSkillIcon(path: string): SpriteFrame {
        return this.mapSkillsIcon.get(path);
    }

    protected onLoad() {
        // 当节点加载时，将当前场景中配置好的实例赋给静态变量
        if (CResManager._instance === null) {
            CResManager._instance = this;
        } else {
            // 防止场景中不小心挂载了多个 CResManager 导致冲突
            this.destroy();
            return;
        }

        //初始化监工数据
        // this.mapMonsters.clear();
        // for (const cfg of this.characterCfg) {
        //     if (!cfg) continue;

        //     this.mapMonsters.set(cfg.eType, cfg);
        // }

        //初始化房间类型map
        this.mapRoomImgData.clear();
        for (const data of this.roomdata) {
            if (!data) continue;

            this.mapRoomImgData.set(data.eRt, data);
        }

        for (const data of this.raceSFCfg) {
            if (!data) continue;

            this.mapRace.set(data.key, data.value);
        }

        for (const data of this.missilePfb) {
            if (!data) continue;

            this.mapMissilePrefab.set(data.emId, data.pfbMissile);
        }

        //所有图片以名字建立索引键
        for (const sf of this.sfAllImg) {
            if (!sf) continue;
            this.mapAllImg.set(sf.name, sf);
        }

        this._dynLoadSkillsIcon();
        this._dyncLoadHerosBundle();
        this._dyncLoadMonstersBundle();
    }

    getImg(name: string): SpriteFrame {
        return this.mapAllImg.get(name);
    }

    getMissilePrefab(id: eMissileId) {
        return this.mapMissilePrefab.get(id);
    }

    getRaceIcon(e: eRace): SpriteFrame {
        return this.mapRace.get(e);
    }

    protected onDestroy() {
        if (CResManager._instance === this) {
            CResManager._instance = null!;
        }
    }

    getCharHead(eType: eCCharacterID): SpriteFrame {
        const cfg = this.mapMonsters.get(eType);
        if (cfg) {
            return cfg.sfHead;
        }

        return null;
    }

    getCharAvatar(eType: eCCharacterID): SpriteFrame {
        const cfg = this.mapMonsters.get(eType);
        if (cfg) {
            return cfg.sfAvatar;
        }

        return null;
    }

    getCharPrefab(eType: eCCharacterID): Prefab {
        const cfg = this.mapMonsters.get(eType);
        if (cfg) {
            return cfg.prefabRole;
        }

        return null;
    }

    getRoomPrefab(eType: eRoomType): Prefab {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        return roomdata.prefabRoom;
    }

    getRoomBg(eType: eRoomType, level: number): SpriteFrame {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        if (level >= 1) {
            for (const data of roomdata.lvdata) {
                if (data.level == level) {
                    return data.Bg;
                }
            }
        }

        return null;
    }

    getRoomFg(eType: eRoomType, level: number): SpriteFrame {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        if (level >= 1) {
            for (const data of roomdata.lvdata) {
                if (data.level == level) {
                    return data.Fg;
                }
            }
        }

        return null;
    }

    getRoomWorker(eType: eRoomType): Prefab {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        return roomdata.prefabWorker;
    }

    getRoomResIcon(eType: eRoomType): SpriteFrame {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        return roomdata.sfResourceIcon;
    }

    getRoomResCapIcon(eType: eRoomType): SpriteFrame {
        const roomdata: CRoomType2Data = this.mapRoomImgData.get(eType);
        return roomdata.sfResCapIcon;
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


