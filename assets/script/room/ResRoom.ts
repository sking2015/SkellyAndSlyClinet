import { _decorator, Node, Label, ProgressBar, Color, Sprite, SpriteFrame, math, Prefab, instantiate, Animation, AnimationClip } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CCharactor } from '../charactor';
import { eRoomType, eMineBuffType, eOverseerType, IPlayerData } from '../BaseDef';
import { COSCfgData, COSSkill, COverseerManager } from '../OverseerMan';
import { CGlobalData } from '../GlobalData';
import { fadeInOut, waitFadeInout, formatCompactNumber, waitUntilAnimationFinished, delay } from '../common/common';
import { CResManager } from '../ResManager';
import { IResData, getResDataByRoomTypeAndLevel } from '../ConfigInterface';
import { LabelGradient } from '../common/LabelGradient';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { gameStateMgr } from '../GameStateMgr';
import { SessionResult } from '../GameConfig';

const { ccclass, property } = _decorator;

const INTERVAL_OUTPUT_PER_TIME = 5; // 生产一个单位资源需要的时间

@ccclass('CResRoom')
export class CResRoom extends CBaseRoom {

    @property({ type: Node, tooltip: "监工出生点" })
    nodeOSBorn: Node = null

    @property({ type: Node, tooltip: "铁匠放这一层" })
    nodeSimthLayer: Node = null;

    @property({ type: Node, tooltip: "监工放这一层" })
    nodeOSLayer: Node = null;

    @property({ type: Node, tooltip: "工人放这一层" })
    nodeWokerLayer: Node = null;

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

    @property({ type: Sprite, tooltip: "显示资源图标" })
    sprResourceIcon: Sprite = null;

    @property({ type: Label, tooltip: "监工名字" })
    lblOSName: Label = null;

    @property({ type: Sprite, tooltip: "监工技能图标" })
    sprOSSkillIcons: Sprite[] = [];

    @property({ type: Label, tooltip: "监工技能说明" })
    lblOSSkillTips: Label[] = [];

    @property({ type: Sprite, tooltip: "扩展面板资源图标" })
    sprExpandResIcon: Sprite = null;

    @property({ type: Label, tooltip: "房间资源产量" })
    lblOutputPerHours: Label = null;

    @property({ type: Sprite, tooltip: "扩展面板资源容量图标" })
    sprResCapIcon: Sprite = null;

    @property({ type: Label, tooltip: "房间资源当前诸量" })
    lblStock: Label = null;

    @property({ type: Label, tooltip: "房间资源当前容量" })
    lblCapacity: Label = null;

    //监工的角色对像
    charOverseer: CCharactor = null;
    eOverseerType: eOverseerType = eOverseerType.eotNone;

    nWorkerNum: number = 0;

    nOutputPerHours: number = 0; //标准产量(以小时计)

    nOutputPerTime: number = 5;// 每单位时间产量

    nCurrentStock: number = 0; // 当前储量
    nCapacity: number = 999; // 房间容量，决定储量上限    

    protected onLoad(): void {
        super.onLoad();

        //资源房间显示的监工先值空
        this.sprOSAvart.spriteFrame = null;
        this.refreshCurrentStock();

    }

    start() {
        super.start();
        this.labelOutputPerTime.string = "";
    }

    setStock(nStock: number) {
        this.nCurrentStock = nStock;
    }

    refreshCurrentStock() {
        this.labelCurrentStock.string = `${formatCompactNumber(this.nCurrentStock)}/${formatCompactNumber(this.nCapacity)}`;
        this.progressBarCurrentStock.progress = this.nCurrentStock / this.nCapacity;

        //如果扩展界打开，要刷新扩展界面的当前存量
        if (this.nodeExpandPanel.active) {
            this.lblStock.string = formatCompactNumber(this.nCurrentStock);
        }
    }

    setRoomType(type: eRoomType) {
        super.setRoomType(type);

        this.sprResourceIcon.spriteFrame = CResManager.instance.getRoomResIcon(this.roomType);
    }

    refreshExpand() {

        this.sprExpandResIcon.spriteFrame = CResManager.instance.getRoomResIcon(this.roomType);
        this.sprResCapIcon.spriteFrame = CResManager.instance.getRoomResCapIcon(this.roomType);

        this.lblStock.string = formatCompactNumber(this.nCurrentStock);

        this.lblOutputPerHours.string = formatCompactNumber(this.nOutputPerHours) + "/HOUR";
        this.lblCapacity.string = formatCompactNumber(this.nCapacity);
    }

    refreshRoomData() {

        if (this.roomLevel <= 0) {
            console.error("can't refresh room data,room level is ", this.roomLevel);
            return;
        }

        let resDataCur: IResData = getResDataByRoomTypeAndLevel(this.roomType, this.roomLevel);
        if (!resDataCur) {
            console.error("can't get res data by room type ", this.roomType, " level ", this.roomLevel);
            return;
        }


        //计算一下每小时产量
        this.nOutputPerHours = resDataCur.ProducePer5Sec * 12 * 60;
        this.nCapacity = resDataCur.MaxCapacity;

        console.log("refreshRoomData~~", this.roomType);


        const osData: COSCfgData = COverseerManager.instance.getOverseerData(this.eOverseerType);
        if (osData) {
            this.lblOSName.string = osData.name;

            for (let i = 0; i < osData.skills.length; ++i) {
                const skillData: COSSkill = osData.skills[i];
                this.sprOSSkillIcons[i].spriteFrame = skillData.sfIcon;
                this.lblOSSkillTips[i].string = skillData.effectTips;

                this.lblOSSkillTips[i].node.getComponent(LabelGradient).bottomColor = Color.fromHEX(new Color(), '#00FF3D');

                this.nOutputPerHours *= 1 + skillData.nRateAdd;
                this.nCapacity *= 1 + skillData.nCapAdd;
            }

        }


        this.nOutputPerTime = resDataCur.ProducePer5Sec;


        this.refreshCurrentStock();

        super.refreshRoomData();
    }

    genWorker() {
        let workerNum = 0;
        let prefab = CResManager.instance.getRoomWorker(this.roomType);
        switch (this.roomType) {
            case eRoomType.ertCrystalMine:
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
        if (this.eOverseerType != eOverseer) {

            //这里是监工动画部份。。。
            this.eOverseerType = eOverseer;
            CGlobalData.instance.setRoomOSTypeByIndex(this.index, this.eOverseerType);
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

            //这里需要刷新数据
            this.refreshRoomData();
        }


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

    onUnlock() {
        this.genWorker();
    }

    //采集由于有客户端表现，所以要分两次采发送消息，首先是开始采集是收到服务器返回成功开始采集
    //由于采集可能耗时很久，在采集完了时要再发一次采集请求，用服务器最新数据刷新界面显示    
    bGatering: boolean = false;
    startGatherRes() {
        gameStateMgr.RoomGather(this.index, (result: SessionResult, data: IPlayerData) => {
            if (SessionResult.SUCCESS == result) {
                this.bGatering = true;
            }
        })

    }

    onceGather() {

        //要大于单位产量才收集
        if (this.nCurrentStock > 0) {

            let count = this.nCurrentStock > this.nOutputPerTime ? this.nOutputPerTime : this.nCurrentStock;
            this.nCurrentStock -= count;

            this.refreshCurrentStock();
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_gather_res, true, { roomType: this.roomType, amount: count, srcNode: this.sprResourceIcon.node }));
        } else {
            //如果已经不大于零，表示已经采集完毕，需要再向服务器请求一次
            this.bGatering = false;
            gameStateMgr.RoomGather(this.index, (result: SessionResult, data: IPlayerData) => {
                if (SessionResult.SUCCESS == result) {
                    CGlobalData.instance.loadData(data);

                    this.nCurrentStock = CGlobalData.instance.getRoomStockByIndex(this.index);
                    this.refreshCurrentStock();

                    //再通知主界面刷新一次，避免和服务器不同步
                    this.node.dispatchEvent((new CustomEvent(UniEvent.on_resource_change, true)));
                }
            })
        }
    }


    onSelectOverseer(eType: eOverseerType) {
        let icon: SpriteFrame = CResManager.instance.getOSHead(eType);
        this.sprOSAvart.spriteFrame = icon;
        this.setOverseer(eType);
    }

    onClickChangeOverseer() {
        console.log("click onClickChangeOverseer");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_ospanel, true, { roomIdx: this.index }));
    }

    onClickResIcon() {
        console.log("click resIcon,收集资源");
        this.startGatherRes();

        // this.genRes4FlyShow();

        //this.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));

    }

    onOutputRes() {
        if (this.nCurrentStock < this.nCapacity) {
            this.nCurrentStock += this.nOutputPerTime;
            if (this.nCurrentStock > this.nCapacity) {
                this.nCurrentStock = this.nCapacity;
            }

            CGlobalData.instance.setRoomStockByIndex(this.index, this.nCurrentStock);
            this.refreshCurrentStock();
        }
    }

    playOutputAnim() {
        this.labelOutputPerTime.string = `+${this.nOutputPerTime.toFixed(2)}`;
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


