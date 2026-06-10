import { _decorator, Color, Component, instantiate, Node, Prefab, math, UITransform, Sprite, SpriteFrame, Animation, Label, ProgressBar, AnimationClip } from 'cc';
import { eRoomType, eMineBuffType, eOverseerType, eWorkerType } from './BaseDef';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CCharactor } from './charactor';
import { CResManager } from './ResManager';
import { CGlobalData } from './GlobalData';
import { fadeInOut, waitFadeInout, formatCompactNumber, waitUntilAnimationFinished, delay } from './common/common';
import { COSCfgData, COSSkill, COverseerManager } from './OverseerMan';
import { LabelGradient } from './common/LabelGradient';
import { getI18nText } from './i18nLan';

import { IResData, getResDataByRoomTypeAndLevel } from './ConfigInterface';
import { gameStateMgr } from './GameStateMgr';
import { GameConfig, SessionResult, GameState, eWebAction } from './GameConfig';


const INTERVAL_OUTPUT_PER_TIME = 5; // 生产一个单位资源需要的时间

const { ccclass, property } = _decorator;





@ccclass('Room')
export class Room extends Component {

    @property(Prefab)
    prefabMiner: Prefab = null;

    @property(UITransform)
    tfBase: UITransform = null;

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

    roomType: eRoomType = eRoomType.ertNone; // 房间类型
    roomLevel: number = 0;

    nWorkerNum: number = 0;

    nOutputPerHours: number = 0; //标准产量(以小时计)

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

        this.oriHeight = this.tfBase.height;

        //显示的监工先值空
        this.sprOSAvart.spriteFrame = null;

        this.nodeUpgradeEffect.active = false;

        this.labelOutputPerTime.string = "";
        this.labelRoomLevel.string = "";
        this.labelRoomName.string = "";
        this.refreshCurrentStock();
    }

    loadRoomData() {

    }

    refreshCurrentStock() {
        this.labelCurrentStock.string = `${formatCompactNumber(this.nCurrentStock)}/${formatCompactNumber(this.nCapacity)}`;
        this.progressBarCurrentStock.progress = this.nCurrentStock / this.nCapacity;

        //如果扩展界打开，要刷新扩展界面的当前存量
        if (this.nodeExpandPanel.active) {
            this.lblStock.string = formatCompactNumber(this.nCurrentStock);
        }
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

        const resData = getResDataByRoomTypeAndLevel(this.roomType, level);
        if (resData) {
            name = resData.Name;
        } else {
            console.error("can't get res data by room type ", this.roomType, " level ", level);
        }

        this.labelRoomName.string = name;

        this.sprResourceIcon.spriteFrame = CResManager.instance.getRoomResIcon(this.roomType);
    }


    setRoomLevel(level: number) {
        this.roomLevel = level;
        CGlobalData.instance.setRoomLevelByIndex(this.index, this.roomLevel);
        this.refreshRoomLevel();
    }

    refreshRoomLevel() {
        if (this.roomLevel > 0) {
            this.labelRoomLevel.string = `Lv.${this.roomLevel}`;
        }
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


        this.refreshExpand();
        this.refreshCurrentStock();
        this.refreshRoomShow();
    }

    refreshExpand() {

        this.sprExpandResIcon.spriteFrame = CResManager.instance.getRoomResIcon(this.roomType);
        this.sprResCapIcon.spriteFrame = CResManager.instance.getRoomResCapIcon(this.roomType);

        this.lblStock.string = formatCompactNumber(this.nCurrentStock);

        this.lblOutputPerHours.string = formatCompactNumber(this.nOutputPerHours) + "/HOUR";
        this.lblCapacity.string = formatCompactNumber(this.nCapacity);
    }

    refreshRoomShow() {
        const nBgLv: number = Math.floor(this.roomLevel / 3) + 1;
        this.sprBg.spriteFrame = CResManager.instance.getRoomBg(this.roomType, nBgLv);
        this.sprFg.spriteFrame = CResManager.instance.getRoomFg(this.roomType, nBgLv);
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
                const nodeText: Node = this.nodeLocked.getChildByName('Label');
                nodeText.active = false;

                this.nodeLocked.active = false;
            });

            this.genWorker();
        });

        CGlobalData.instance.unlockRoom();

        this.playUpgradeEffect(false);
        this.refreshRoomData();

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_unlock, true, { roomIdx: this.index }));
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


    onOpenExpand() {
        this.nodeExpandPanel.active = true;
        this.refreshExpand();
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

    onSelectOverseer(eType: eOverseerType,) {
        let icon: SpriteFrame = CResManager.instance.getOSHead(eType);
        this.sprOSAvart.spriteFrame = icon;
        this.setOverseer(eType);
    }

    playUpgradeEffect(bShowLevelLabel: boolean = true) {

        const nodeLevelLabel = this.nodeUpgradeEffect.getChildByName("label");
        nodeLevelLabel.active = bShowLevelLabel;

        this.nodeUpgradeEffect.active = true;
        let anim = this.nodeUpgradeEffect.getComponent(Animation);
        const sAni = anim.clips[0].name;

        anim.play(sAni);
        anim.once(Animation.EventType.FINISHED, () => {
            this.nodeUpgradeEffect.active = false;
        });

    }

    async onUpgrade() {
        console.log("room upgrade~!!!")

        if (this.roomLevel < 9) {

            const [result, data] = await gameStateMgr.RoomLvUpPromise(this.index);
            if (result != SessionResult.SUCCESS) {
                console.log("服务器错误，以后看是弹个窗叫玩家重连还是干啥")
                return;
            }

            this.node.dispatchEvent(new CustomEvent(UniEvent.on_resource_change, true));
            if (this.roomLevel == 3 || this.roomLevel == 6) {
                this.nodeLocked.active = true;
                await waitFadeInout(this.nodeLocked, 0.3, true);

                let comUnlock = this.nodeLocked.getComponent(Animation);
                const sAni = comUnlock.clips[0].name;

                const animState = comUnlock.getState(sAni);

                animState.wrapMode = AnimationClip.WrapMode.Reverse;
                comUnlock.play(sAni);
                await waitUntilAnimationFinished(comUnlock);
                await delay(0.3, this);

                animState.wrapMode = AnimationClip.WrapMode.Normal;
                comUnlock.play(sAni);
                await waitUntilAnimationFinished(comUnlock);
            }


            this.setRoomLevel(this.roomLevel + 1);
            this.refreshRoomShow();
            this.playUpgradeEffect();

            await waitFadeInout(this.nodeLocked, 0.3, false);
            this.nodeLocked.active = false;

        }
    }

    onClickChangeOverseer() {
        console.log("click onClickChangeOverseer");
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_ospanel, true, { roomIdx: this.index }));
    }

    onClickRoomUpgrade() {
        console.log("click onClickOpenRoomUpgrade");
        if (this.roomLevel < 9) {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_open_room_upgrade, true, { roomIdx: this.index }));

            this.CloseExpand();
        } else {
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, { tips: getI18nText("HAVE_BEEN_MAXLV") }));
        }

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


