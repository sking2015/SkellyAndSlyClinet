import { _decorator, Component, instantiate, Node, Prefab, math, UITransform, Sprite, SpriteFrame, Animation, animation } from 'cc';
import { eRoomType, eMineBuffType, eOverseerType, eWorkerType } from './BaseDef';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CCharactor } from './charactor';
import { CResManager } from './ResManager';
import { CGlobalData } from './GlobalData';
import { fadeInOut } from './common/common';



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

    @property({ type: Node, tooltip: "监工放这一层" })
    nodeOSLayer: Node = null;

    @property({ type: Node, tooltip: "工人放这一层" })
    nodeWokerLayer: Node = null;

    @property({ type: Node, tooltip: "扩展面板" })
    nodeExpandPanel: Node = null;


    @property({ type: Sprite, tooltip: "显示监工头像" })
    sprOSAvart: Sprite = null;

    @property({ type: Node, tooltip: "升级特效" })
    nodeUpgradeEffect: Node = null;


    @property({ type: Node, tooltip: "锁定节点，若房间未解锁则显示" })
    nodeLocked: Node = null;


    //监工的角色对像
    charOverseer: CCharactor = null;

    roomType: eRoomType = eRoomType.ertNone; // 房间类型
    roomLevel: number = 0;


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
    }

    start() {
        this.nodeLockLabel = this.nodeLocked.getChildByName("Label");
        this.refreshRoomLockShow();
    }

    addBuff(eMBT: eMineBuffType) {

    }

    setRoomType(type: eRoomType) {
        this.roomType = type;
    }

    setRoomLevel(level: number) {
        this.roomLevel = level;
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

        this.roomLevel = 1;
        let comUnlock = this.nodeLocked.getComponent(Animation);
        comUnlock.play(comUnlock.clips[0].name);
        comUnlock.once(Animation.EventType.FINISHED, () => {
            fadeInOut(this.nodeLocked, 0.5, false, () => {
                this.nodeLocked.active = false;
            });
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
                workerNum = 2;
                break;
            case eRoomType.ertLumberMill:
                workerNum = 3;
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
        nodeWorker.parent = this.nodeWokerLayer;

        const charWorker = nodeWorker.getComponent(CCharactor);

        if (this.roomType == eRoomType.ertMetalWorkshop) {
            nodeWorker.setPosition(math.v3(8, -80));
        } else {
            const bornX = Math.random() > 0.5 ? 350 : -350;
            console.log("bornX", bornX);
            nodeWorker.setPosition(math.v3(bornX, -85));
            charWorker.setActionRange(-250, 250);
        }
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

    onClickResIcon() {
        console.log("click resIcon");
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

    update(deltaTime: number) {

    }
}


