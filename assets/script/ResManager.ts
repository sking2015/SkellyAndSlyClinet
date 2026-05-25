import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
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

    // 静态实例变量
    private static _instance: CResManager = null!;

    // 静态获取器
    public static get instance(): CResManager {
        if (!CResManager._instance) {
            console.error("CResManager 尚未初始化！请确保它被挂载到了场景的节点上。");
        }
        return CResManager._instance;
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

    start() {

    }

    update(deltaTime: number) {

    }
}


