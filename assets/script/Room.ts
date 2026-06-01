import { _decorator, Component, instantiate, Node, Prefab, math, UITransform, Sprite, SpriteFrame, Animation, Label, ProgressBar, tween } from 'cc';
import { eRoomType, eMineBuffType, eOverseerType, eWorkerType } from './BaseDef';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CCharactor } from './charactor';
import { CResManager } from './ResManager';
import { CGlobalData } from './GlobalData';
import { fadeInOut } from './common/common';

import { ICrystalMine, CrystalMineData } from './config/CrystalMine';
import { IMetalWorkshop, MetalWorkshopData } from './config/MetalWorkshop';
import { ILumberMill, LumberMillData } from './config/LumberMill';


const INTERVAL_OUTPUT_PER_TIME = 5; // 生产一个单位资源需要的时间

const { ccclass, property } = _decorator;



@ccclass('Room')
export class Room extends Component {

    @property(Prefab)
    prefabMiner: Prefab = null;

    @property(Sprite)
    sprBg: Sprite = null;

    @property(Sprite)
    sprFg: Sprite = null;

    @property(Prefab)
    prefabLumberjack: Prefab = null;

    @property({ type: Node, tooltip: "监工出生点" })
    nodeOSBorn: Node = null

    @property({ type: Node, tooltip: "铁匠放这一层" })
    nodeSimthLayer: Node = null;

    @property({ type: Node, tooltip: "监工放这一层" })
    nodeOSLayer: Node = null;

    @property({ type: Node, tooltip: "工人放这一层" })
    nodeWokerLayer: Node = null;

    @property({ type: Node, tooltip: "扩展面板" })
    nodeExpandPanel: Node = null;

    @property({ type: Label, tooltip: "显示的房间等级" })
    labelRoomLevel: Label = null;

    @property({ type: Label, tooltip: "显示的房间名" })
    labelRoomName: Label = null;

    @property({ type: Label, tooltip: "单位时间产量显示" })
    labelOutputPerTime: Label = null;

    @property({ type: Animation, tooltip: "单位时间产量动画" })
    animOutputPerTime: Animation = null;

    @property({ type: Label, tooltip: "当前储量显示" })
    labelCurrentStock: Label = null;

    @property({ type: ProgressBar, tooltip: "当前储量进度条" })
    progressBarCurrentStock: ProgressBar = null;


    @property({ type: Sprite, tooltip: "显示监工头像" })
    sprOSAvart: Sprite = null;

    @property({ type: Node, tooltip: "升级特效" })
    nodeUpgradeEffect: Node = null;


    @property({ type: Node, tooltip: "锁定节点，若房间未解锁则显示" })
    nodeLocked: Node = null;


    @property({ type: Sprite, tooltip: "显示资源图标" })
    sprResourceIcon: Sprite = null;


    //监工的角色对像
    charOverseer: CCharactor = null;

    roomType: eRoomType = eRoomType.ertNone; // 房间类型
    roomLevel: number = 0;

    nWorkerNum: number = 0;

    nOutputPerTime: number = 5;// 每单位时间产量

    nCurrentStock: number = 0; // 当前储量
    nCapacity: number = 999; // 房间容量，决定储量上限


    private _index: number = 0;

    set index(idx: number) {
        this._index = idx;
        this.offset = this._index * this.oriHeight;
        console.log("room index", this._index, "offset", this.offset);
    }

    get index() {
        return this._index;
    }

    //房间原始高度
    oriHeight: number = 0;
    //房间离roomview顶部距离
    offset: number = 0;


    nodeLockLabel: Node = null;
    bUnlockable: boolean = false; // 是否可解锁，只有当上一个房间解锁后才会变为true

    protected onLoad(): void {
        this.nodeExpandPanel.active = false;

        const uiTransform = this.node.getComponent(UITransform);
        this.oriHeight = uiTransform.height;

        //显示的监工先值空
        this.sprOSAvart.spriteFrame = null;

        this.nodeUpgradeEffect.active = false;

        this.labelOutputPerTime.string = "";
        this.labelRoomLevel.string = "";
        this.labelRoomName.string = "";
        this.refreshCurrentStock();
    }

    refreshCurrentStock() {
        this.labelCurrentStock.string = `${this.nCurrentStock}/${this.nCapacity}`;
        this.progressBarCurrentStock.progress = this.nCurrentStock / this.nCapacity;
    }

    start() {
        this.nodeLockLabel = this.nodeLocked.getChildByName("Label");
        this.refreshRoomLockShow();
    }

    addBuff(eMBT: eMineBuffType) {

    }

    setRoomType(type: eRoomType) {
        this.roomType = type;

        let level = this.roomLevel > 0 ? this.roomLevel : 1;
        let name = "Mine"

        switch (this.roomType) {
            case eRoomType.ertLumberMill:
                this.nodeOSBorn.y = -80;
                name = LumberMillData[level].Name;
                break;
            case eRoomType.ertGemMine:
                this.nodeOSBorn.y = -80;
                name = CrystalMineData[level].Name;
                break;
            case eRoomType.ertMetalWorkshop:
                this.nodeOSBorn.y = -90;
                name = MetalWorkshopData[level].Name;
                break;
        }

        this.labelRoomName.string = name;

        this.sprResourceIcon.spriteFrame = CResManager.instance.getRoomResIcon(this.roomType);
    }


    setRoomLevel(level: number) {
        this.roomLevel = level;
        this.refreshRoomLevel();
    }

    refreshRoomLevel() {
        if (this.roomLevel > 0) {
            this.labelRoomLevel.string = `Lv.${this.roomLevel}`;
        }
    }

    refreshRoomShow() {
        this.sprBg.spriteFrame = CResManager.instance.getRoomBg(this.roomType, this.roomLevel);
        this.sprFg.spriteFrame = CResManager.instance.getRoomFg(this.roomType, this.roomLevel);
    }

    refreshRoomLockShow() {
        this.nodeLocked.active = CGlobalData.instance.getUnlockRoomNum() <= this.index;
        if (this.nodeLockLabel) {
            const bShow = CGlobalData.instance.getUnlockRoomNum() == this.index;
            this.nodeLockLabel.active = bShow;
            this.bUnlockable = bShow;
            fadeInOut(this.nodeLockLabel, 0.5, bShow);
        }
    }

    onClickUnLock() {
        console.log("click unlock");
        if (!this.bUnlockable) {
            console.log("can't unlock,not unlockable");
            return;
        }

        this.setRoomLevel(1);

        let comUnlock = this.nodeLocked.getComponent(Animation);
        comUnlock.play(comUnlock.clips[0].name);
        comUnlock.once(Animation.EventType.FINISHED, () => {
            fadeInOut(this.nodeLocked, 0.5, false, () => {
                this.nodeLocked.active = false;
            });

            this.genWorker();
        });

        CGlobalData.instance.unlockRoom();

        this.playUpgradeEffect(false);
        this.refreshRoomShow();

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_unlock, true, { roomIdx: this.index }));
    }

    genWorker() {
        let workerNum = 0;
        let prefab = CResManager.instance.getRoomWorker(this.roomType);
        switch (this.roomType) {
            case eRoomType.ertGemMine:
            case eRoomType.ertLumberMill:
                workerNum = 2;
                break;

            case eRoomType.ertMetalWorkshop:
                workerNum = 1;
                break;
        }

        for (let i = 0; i < workerNum; ++i) {
            this.addWorker(prefab);
        }
    }

    setOverseer(eOverseer: eOverseerType) {
        let prefabOS: Prefab = CResManager.instance.getOSPrefab(eOverseer);

        const nodeOs = instantiate(prefabOS);
        nodeOs.position = this.nodeOSBorn.position;
        console.log("check position", nodeOs.position);
        nodeOs.parent = this.nodeOSLayer;
        // nodeOs.scale = math.v3(0.8, 0.8, 0.8);

        //监工只能有一个，设置新的就要把老的释放掉
        if (this.charOverseer && this.charOverseer.node) {
            this.charOverseer.node.destroy();
            this.charOverseer = null;
        }

        this.charOverseer = nodeOs.getComponent(CCharactor);
        this.charOverseer.setActionRange(-250, 250);
        this.charOverseer.playLand();

    }

    addWorker(prefabWorder: Prefab) {
        const nodeWorker = instantiate(prefabWorder);

        if (this.roomType == eRoomType.ertMetalWorkshop) {
            nodeWorker.parent = this.nodeSimthLayer;
        } else {
            nodeWorker.parent = this.nodeWokerLayer;
        }

        const charWorker = nodeWorker.getComponent(CCharactor);

        if (this.roomType == eRoomType.ertMetalWorkshop) {
            nodeWorker.setPosition(math.v3(8, -80));
        } else {
            let bornX = -350;
            if (this.nWorkerNum % 2 == 1) {
                bornX = 350;
            }

            console.log("bornX", bornX);
            nodeWorker.setPosition(math.v3(bornX, -85));
            charWorker.setActionRange(-250, 250);
        }

        this.nWorkerNum++;
    }


    onOpenExpand() {
        this.nodeExpandPanel.active = true;
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_expand, true, { index: this.index, offset: this.offset }))
    }

    onCloseExpand() {
        this.CloseExpand();
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_restore, true, { index: this.index }))
    }


    CloseExpand() {
        this.nodeExpandPanel.active = false;
    }



    onClickSetting() {
        console.log("click setting");

        this.onOpenExpand();

        // console.log("先用来测试一下设置监工");
        // this.setOverseer(eOverseerType.eotEyetyarnt);
    }

    bGatering: boolean = false;
    startGatherRes() {
        this.bGatering = true;
    }

    onceGather() {
        switch (this.roomType) {
            case eRoomType.ertLumberMill:
                CGlobalData.instance.nWood += this.nOutputPerTime;
                break;
            case eRoomType.ertMetalWorkshop:
                CGlobalData.instance.nMetal += this.nOutputPerTime;
                break;
            case eRoomType.ertGemMine:
                CGlobalData.instance.nGem += this.nOutputPerTime;
                break;
        }

        this.nCurrentStock -= this.nOutputPerTime;

        //收集完毕
        if (this.nCurrentStock <= 0) {
            this.nCurrentStock = 0;
            this.bGatering = false;
        }

        this.refreshCurrentStock();
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_gather_res, true, { roomType: this.roomType, amount: this.nOutputPerTime, srcNode: this.sprResourceIcon.node }));
    }


    onClickResIcon() {
        console.log("click resIcon,收集资源");
        this.startGatherRes();

        // this.genRes4FlyShow();

        //this.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));

    }

    onSelectOverseer(eType: eOverseerType) {
        let icon: SpriteFrame = CResManager.instance.getOSHead(eType);
        this.sprOSAvart.spriteFrame = icon;
        this.setOverseer(eType);
    }

    playUpgradeEffect(bShowLevelLabel: boolean = true) {

        const nodeLevelLabel = this.nodeUpgradeEffect.getChildByName("label");
        nodeLevelLabel.active = bShowLevelLabel;

        this.nodeUpgradeEffect.active = true;
        let anim = this.nodeUpgradeEffect.getComponent(Animation);
        anim.play(anim.clips[0].name);
        anim.once(Animation.EventType.FINISHED, () => {
            this.nodeUpgradeEffect.active = false;
        });

    }

    onUpgrade() {
        console.log("room upgrade~!!!")
        if (this.roomLevel < 3) {
            ++this.roomLevel;
            this.refreshRoomLevel();
            this.refreshRoomShow();
            this.playUpgradeEffect();
        }
    }

    onClickChangeOverseer() {
        console.log("click onClickChangeOverseer");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_ospanel, true, { roomIdx: this.index }));
    }

    onClickRoomUpgrade() {
        console.log("click onClickOpenRoomUpgrade");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_upgrade, true, { roomIdx: this.index }));

        this.CloseExpand();
    }


    onOutputRes() {
        if (this.nCurrentStock < this.nCapacity) {
            this.nCurrentStock += this.nOutputPerTime;
            if (this.nCurrentStock > this.nCapacity) {
                this.nCurrentStock = this.nCapacity;
            }
            this.refreshCurrentStock();
        }
    }

    playOutputAnim() {
        this.labelOutputPerTime.string = `+${this.nOutputPerTime}`;
        if (this.animOutputPerTime) {
            this.animOutputPerTime.play(this.animOutputPerTime.clips[0].name);
            this.animOutputPerTime.once(Animation.EventType.FINISHED, () => {
                this.labelOutputPerTime.string = "";
            });
        }
    }



    nOutputInterval: number = 0; // 生产一个单位资源需要的时间
    nGatherInterval: number = 0; // 收集一个单位资源需要的时间

    updateGather(deltaTime: number) {
        //这里可以加一些收集资源的特效，比如飞出一些资源图标之类的
        this.nGatherInterval += deltaTime;
        if (this.nGatherInterval >= 0.1) {
            this.nGatherInterval = 0;
            this.onceGather();
        }
    }

    update(deltaTime: number) {
        if (this.roomLevel <= 0) {
            return;
        }

        this.nOutputInterval += deltaTime;
        if (this.nOutputInterval >= INTERVAL_OUTPUT_PER_TIME) {
            this.nOutputInterval = 0;
            this.onOutputRes();
            this.playOutputAnim();
        }

        if (this.bGatering) {
            this.updateGather(deltaTime);
        }

    }
}


