import { _decorator, Node, Label, ProgressBar, Color, Sprite, SpriteFrame, math, Prefab, instantiate, Animation, AnimationClip } from 'cc';
import { CBaseRoom } from './BaseRoom';
import { CCharacter } from '../character/character';
import { eRoomType, eMineBuffType, eCCharacterID, IPlayerData } from '../BaseDef';
import { COSCfgData, COSSkill, COverseerManager } from '../OverseerMan';
import { CGlobalData } from '../GlobalData';
import { fadeInOut, waitFadeInout, formatCompactNumber, waitUntilAnimationFinished, delay } from '../common/common';
import { CResManager } from '../ResManager';
import { IResData, getResDataByRoomTypeAndLevel } from '../ConfigInterface';
import { LabelGradient } from '../common/LabelGradient';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { gameStateMgr } from '../GameStateMgr';
import { SessionResult } from '../GameConfig';
import { newRequestId } from '../Protocol';
import { CCharactersManager } from '../CharacaterMannager';

const { ccclass, property } = _decorator;

const INTERVAL_OUTPUT_PER_TIME = 5; // 生产一个单位资源需要的时间
const MAX_GATHER_TIME = 10;

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
    charOverseer: CCharacter = null;
    eCCharacterID: eCCharacterID = eCCharacterID.eciNone;

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


        const osData: COSCfgData = COverseerManager.instance.getOverseerData(this.eCCharacterID);
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

    async setOverseer(eOverseer: eCCharacterID) {
        if (this.eCCharacterID != eOverseer) {

            //这里是监工动画部份。。。
            this.eCCharacterID = eOverseer;
            if (!gameStateMgr.online) CGlobalData.instance.setRoomOSIdByIndex(this.index, this.eCCharacterID);

            if (eOverseer === eCCharacterID.eciNone) {
                if (this.charOverseer) CCharactersManager.instance.ReleaseChacater(this.charOverseer);
                this.charOverseer = null;
                this.sprOSAvart.spriteFrame = null;
                this.lblOSName.string = '';
                this.sprOSSkillIcons.forEach(icon => icon.spriteFrame = null);
                this.lblOSSkillTips.forEach(label => label.string = '');
                this.refreshRoomData();
                return;
            }
            const comOS: CCharacter = await CCharactersManager.instance.CreateChacater4room(this.eCCharacterID, this);
            const nodeOS = comOS.node;


            nodeOS.position = this.nodeOSBorn.position;
            console.log("check position", nodeOS.position);
            nodeOS.parent = this.nodeOSLayer;
            // nodeOs.scale = math.v3(0.8, 0.8, 0.8);


            //监工只能有一个，设置新的就要把老的释放掉
            if (this.charOverseer) CCharactersManager.instance.ReleaseChacater(this.charOverseer);

            this.charOverseer = comOS;
            this.charOverseer.setActionRange(-250, 250);
            this.charOverseer.playLand();

            //这里需要刷新数据
            this.refreshRoomData();
        }


    }

    listWorker: CCharacter[] = [];
    addWorker(prefabWorder: Prefab) {
        const nodeWorker = instantiate(prefabWorder);

        if (this.roomType == eRoomType.ertMetalWorkshop) {
            nodeWorker.parent = this.nodeSimthLayer;
        } else {
            nodeWorker.parent = this.nodeWokerLayer;
        }

        const charWorker = nodeWorker.getComponent(CCharacter);

        charWorker.EnableWork(!this.isResFull());
        this.listWorker.push(charWorker);

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
    nOnceGather: number = 0;
    private gatherPending = false;
    private gatherSession = '';
    get isGathering() { return this.bGatering || this.gatherPending; }
    async startGatherRes() {
        if (this.bGatering || this.gatherPending) return;
        this.gatherPending = true;
        this.gatherSession = newRequestId();
        const global = CGlobalData.instance;
        const balance = this.roomType === eRoomType.ertLumberMill ? global.nWood
            : this.roomType === eRoomType.ertMetalWorkshop ? global.nMetal : global.nCrystal;
        try {
            const reply = await gameStateMgr.operation('room-gather', {
                room_index: this.index, gather_session_id: this.gatherSession, phase: 'start',
            });
            if (!reply.ok) return;
            if (gameStateMgr.online) this.node.dispatchEvent(new CustomEvent(UniEvent.on_gather_preview, true,
                { roomType: this.roomType, balance, finished: false }));
            this.bGatering = true;
            this.enableWorkersWork(true);
            this.nOnceGather = Math.max(this.nCurrentStock / MAX_GATHER_TIME, this.nOutputPerTime);
        } finally { this.gatherPending = false; }
    }

    onceGather() {

        if (this.nCurrentStock > 0) {

            let count = this.nCurrentStock > this.nOnceGather ? this.nOnceGather : this.nCurrentStock;
            this.nCurrentStock -= count;

            this.refreshCurrentStock();
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_click_gather_res, true, { roomType: this.roomType, amount: count, srcNode: this.sprResourceIcon.node }));
        } else {
            //如果已经不大于零，表示已经采集完毕，需要再向服务器请求一次
            this.bGatering = false;
            this.gatherPending = true;
            if (!gameStateMgr.online) CGlobalData.instance.setRoomStockByIndex(this.index, this.nCurrentStock);
            void gameStateMgr.operation('room-gather', {
                room_index: this.index, gather_session_id: this.gatherSession, phase: 'finish',
            }).then(reply => {
                if (reply.ok) {
                    this.nCurrentStock = CGlobalData.instance.getRoomStockByIndex(this.index);
                    this.refreshCurrentStock();
                    this.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));
                }
            }).then(() => this.finishGatherDisplay(), () => this.finishGatherDisplay());
        }
    }


    private finishGatherDisplay() {
        this.gatherPending = false;
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_gather_preview, true,
            { roomType: this.roomType, finished: true }));
    }

    private overseerPending = false;
    async onSelectOverseer(eType: eCCharacterID) {
        if (this.overseerPending) return;
        if (gameStateMgr.online) {
            this.overseerPending = true;
            try {
                if (!(await gameStateMgr.operation('room-change-os', {
                    room_index: this.index, overseer_id: eType,
                })).ok) return;
            } finally { this.overseerPending = false; }
        }
        let icon: SpriteFrame = CResManager.instance.getCharHead(eType);
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

    private enableWorkersWork(bEnable: boolean) {
        this.listWorker.forEach((char: CCharacter) => {
            char.EnableWork(bEnable);
        })
    }

    //资源是否已满
    private isResFull(): boolean {
        return this.nCurrentStock >= this.nCapacity;
    }

    onOutputRes() {
        if (!this.isResFull()) {
            this.nCurrentStock += this.nOutputPerTime;
            if (this.nCurrentStock > this.nCapacity) {
                this.nCurrentStock = this.nCapacity;
                this.enableWorkersWork(false);
            }

            if (!gameStateMgr.online) CGlobalData.instance.setRoomStockByIndex(this.index, this.nCurrentStock);
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

        if (!this.isResFull()) {
            this.nOutputInterval += deltaTime;
            if (this.nOutputInterval >= INTERVAL_OUTPUT_PER_TIME) {
                this.nOutputInterval = 0;
                this.onOutputRes();
                this.playOutputAnim();
            }
        }


        if (this.bGatering) {
            this.updateGather(deltaTime);
        }

    }
}


