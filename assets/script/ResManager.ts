import { _decorator, Component, Node, Prefab, SpriteFrame, assetManager, AssetManager, isValid } from 'cc';
import { COverseerCfg, CRoomType2Data } from './KeyValuePair';
import { eOverseerType, eRoomType } from './BaseDef';
const { ccclass, property } = _decorator;

@ccclass('CResManager')
export class CResManager extends Component {

    @property({ type: COverseerCfg, tooltip: "所有监工定义" })
    overseerCfg: COverseerCfg[] = [];


    @property({ type: CRoomType2Data, tooltip: "所有房间数据定义" })
    roomdata: CRoomType2Data[] = [];


    private mapOverseer: Map<eOverseerType, COverseerCfg> = new Map();

    private mapRoomImgData: Map<eRoomType, CRoomType2Data> = new Map();


    private mapSkillsIcon: Map<string, SpriteFrame> = new Map();

    // 静态实例变量
    private static _instance: CResManager = null!;

    // 静态获取器
    public static get instance(): CResManager {
        if (!CResManager._instance) {
            console.error("CResManager 尚未初始化！请确保它被挂载到了场景的节点上。");
        }
        return CResManager._instance;
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
        this.mapOverseer.clear();
        for (const cfg of this.overseerCfg) {
            if (!cfg) continue;

            this.mapOverseer.set(cfg.eType, cfg);
        }

        //初始化房间类型map
        this.mapRoomImgData.clear();
        for (const data of this.roomdata) {
            if (!data) continue;

            this.mapRoomImgData.set(data.eRt, data);
        }

        this._dynLoadSkillsIcon();
    }

    protected onDestroy() {
        if (CResManager._instance === this) {
            CResManager._instance = null!;
        }
    }

    getOSHead(eType: eOverseerType): SpriteFrame {
        const cfg = this.mapOverseer.get(eType);
        if (cfg) {
            return cfg.sfHead;
        }

        return null;
    }

    getOSAvatar(eType: eOverseerType): SpriteFrame {
        const cfg = this.mapOverseer.get(eType);
        if (cfg) {
            return cfg.sfAvatar;
        }

        return null;
    }

    getOSPrefab(eType: eOverseerType): Prefab {
        const cfg = this.mapOverseer.get(eType);
        if (cfg) {
            return cfg.prefabRole;
        }

        return null;
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


