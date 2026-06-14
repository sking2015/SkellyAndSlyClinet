import { _decorator, Component, UITransform, Sprite, Node, Label, Animation, AnimationClip } from 'cc';
import { eRoomType } from '../BaseDef';
import { CustomEvent, UniEvent } from '../common/CustomEvent';
import { CGlobalData } from '../GlobalData';
import { fadeInOut, waitFadeInout, formatCompactNumber, waitUntilAnimationFinished, delay } from '../common/common';
import { getRoomName } from '../ConfigInterface';
import { CResManager } from '../ResManager';
import { getI18nText } from '../i18nLan';
import { gameStateMgr } from '../GameStateMgr';
import { GameConfig, SessionResult, GameState, eWebAction } from '../GameConfig';


const { ccclass, property } = _decorator;

@ccclass('CBaseRoom')
export class CBaseRoom extends Component {

    @property(UITransform)
    tfBase: UITransform = null;

    @property(Sprite)
    sprBg: Sprite = null;

    @property(Sprite)
    sprFg: Sprite = null;

    @property({ type: Label, tooltip: "显示的房间等级" })
    labelRoomLevel: Label = null;

    @property({ type: Label, tooltip: "显示的房间名" })
    labelRoomName: Label = null;

    @property({ type: Node, tooltip: "升级特效" })
    nodeUpgradeEffect: Node = null;


    @property({ type: Node, tooltip: "锁定节点，若房间未解锁则显示" })
    nodeLocked: Node = null;

    @property({ type: Node, tooltip: "扩展面板" })
    nodeExpandPanel: Node = null;


    roomType: eRoomType = eRoomType.ertNone; // 房间类型
    roomLevel: number = 0;

    nodeLockLabel: Node = null;
    bUnlockable: boolean = false; // 是否可解锁，目前简单写成只有当上一个房间解锁后才会变为true    

    //房间原始高度
    oriHeight: number = 0;
    //房间离roomview顶部距离
    offset: number = 0;

    private _index: number = 0;

    set index(idx: number) {
        this._index = idx;
        this.offset = this._index * this.oriHeight;
        console.log("room index", this._index, "offset", this.offset);
    }

    get index() {
        return this._index;
    }

    protected onLoad(): void {
        this.nodeExpandPanel.active = false;

        this.oriHeight = this.tfBase.height;

        this.nodeUpgradeEffect.active = false;

        this.labelRoomLevel.string = "";
        this.labelRoomName.string = "";
    }


    refreshRoomLockShow() {
        console.log("refreshRoomLockShow~~", this.index);
        this.nodeLocked.active = CGlobalData.instance.getUnlockRoomNum() <= this.index;
        if (this.nodeLockLabel) {
            const bShow = CGlobalData.instance.getUnlockRoomNum() == this.index;
            this.nodeLockLabel.active = bShow;
            this.bUnlockable = bShow;
            fadeInOut(this.nodeLockLabel, 0.5, bShow);
        } else {
            this.refreshRoomShow();
        }
    }

    setStock(nStock: number) {
        console.log("资源型房间需要设置当前存量资源");
    }

    refreshRoomData() {
        this.refreshExpand();
        this.refreshRoomShow();
    }

    start() {
        this.nodeLockLabel = this.nodeLocked.getChildByName("Label");
        this.refreshRoomLockShow();
    }



    setRoomType(type: eRoomType) {
        this.roomType = type;
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

    refreshRoomShow() {
        const name = getRoomName(this.index);

        this.labelRoomName.string = name;

        this.refreshRoomScenery();
    }

    //刷新房间布景
    refreshRoomScenery() {
        const nImgLv: number = Math.floor(this.roomLevel / 3 - 0.1) + 1;
        this.sprBg.spriteFrame = CResManager.instance.getRoomBg(this.roomType, nImgLv);
        this.sprFg.spriteFrame = CResManager.instance.getRoomFg(this.roomType, nImgLv);
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

    refreshExpand() {
        console.log("房间基类刷新扩展面板，一般情况下需要在派生类重写");
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

    onUnlock() {

    }

    async onClickUnLock() {
        console.log("click unlock");
        if (!this.bUnlockable) {
            console.log("can't unlock,not unlockable");
            return;
        }

        //解锁和升级的服务器逻辑完全一样
        const [result, data] = await gameStateMgr.RoomLvUpPromise(this.index);
        if (result != SessionResult.SUCCESS) {
            console.log("服务器错误，以后看是弹个窗叫玩家重连还是干啥")
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

            this.onUnlock();
        });


        if (GameConfig.ONLY_DEBUG_CLINTE) {
            CGlobalData.instance.unlockRoom();
        }


        this.playUpgradeEffect(false);
        this.refreshRoomData();

        this.node.dispatchEvent(new CustomEvent(UniEvent.on_room_unlock, true, { roomIdx: this.index }));
    }

    onClickSetting() {
        console.log("click setting");

        this.onOpenExpand();

        // console.log("先用来测试一下设置监工");
        // this.setOverseer(CCharacterID.eciEyetyarnt);
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

                this.setRoomLevel(this.roomLevel + 1);
                this.refreshRoomShow();

                animState.wrapMode = AnimationClip.WrapMode.Normal;
                comUnlock.play(sAni);
                await waitUntilAnimationFinished(comUnlock);
            } else {
                this.setRoomLevel(this.roomLevel + 1);
                this.refreshRoomShow();
            }

            this.playUpgradeEffect();

            await waitFadeInout(this.nodeLocked, 0.3, false);
            this.nodeLocked.active = false;

        }
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

    onSelectOverseer(eType: any) {
    }

    update(deltaTime: number) {

    }
}


