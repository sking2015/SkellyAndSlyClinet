import { _decorator, Component, instantiate, Node, Prefab, math, UITransform, Sprite, SpriteFrame } from 'cc';
import { eRoomType, eMineBuffType, eOverseerType, eWorkerType } from './BaseDef';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CCharactor } from './charactor';
import { CkeyValuePair4Spriteframe } from './KeyValuePair';


const { ccclass, property } = _decorator;



@ccclass('Room')
export class Room extends Component {

    @property(Prefab)
    prefabMiner: Prefab = null;

    @property(Prefab)
    prefabLumberjack: Prefab = null;

    @property({ type: Prefab, tooltip: "监工独眼巨人prefab" })
    prefabEyeTyrant: Prefab = null;

    @property({ type: Node, tooltip: "监工出生点" })
    nodeOSBorn: Node = null

    @property({ type: Node, tooltip: "监工放这一层" })
    nodeOSLayer: Node = null;

    @property({ type: Node, tooltip: "工人放这一层" })
    nodeWokerLayer: Node = null;

    @property({ type: Node, tooltip: "扩展面板" })
    nodeExpandPanel: Node = null;

    @property({ type: CkeyValuePair4Spriteframe, tooltip: "所有监工头像" })
    sfOSList: CkeyValuePair4Spriteframe[] = []


    @property({ type: Sprite, tooltip: "显示监工头像" })
    sprOSAvart: Sprite = null;








    //监工的角色对像
    charOverseer: CCharactor = null;

    roomType: eRoomType = eRoomType.ertNone; // 房间类型


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

    protected onLoad(): void {
        this.nodeExpandPanel.active = false;

        const uiTransform = this.node.getComponent(UITransform);
        this.oriHeight = uiTransform.height;

        //显示的监工先值空
        this.sprOSAvart.spriteFrame = null;
    }

    start() {

    }

    addBuff(eMBT: eMineBuffType) {

    }

    setRoomType(type: eRoomType) {
        this.roomType = type;
    }

    setOverseer(eOverseer: eOverseerType) {
        let prefabOS: Prefab = null;
        switch (eOverseer) {
            case eOverseerType.eotEyetyarnt:
                prefabOS = this.prefabEyeTyrant;
                break;
            default:
                console.log("error eOverseer type");
        }
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

    addWorker(eWorker: eWorkerType) {
        let prefabWorker: Prefab = null;
        switch (eWorker) {
            case eWorkerType.ewtMiner:
                prefabWorker = this.prefabMiner;
                break;
            case eWorkerType.ewtWood:
                prefabWorker = this.prefabLumberjack;
                break;
            default:
                console.log("error eOverseer type");
        }

        const nodeWorker = instantiate(prefabWorker);
        nodeWorker.parent = this.nodeWokerLayer;

        const charWorker = nodeWorker.getComponent(CCharactor);

        const bornX = Math.random() > 0.5 ? 350 : -350;

        console.log("bornX", bornX);

        nodeWorker.setPosition(math.v3(bornX, -85));
        charWorker.setActionRange(-250, 250);
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
        this.addWorker(eWorkerType.ewtMiner);
    }

    getOverseerIcon(oType: eOverseerType): SpriteFrame {
        for (let i = 0; i < this.sfOSList.length; ++i) {
            const kvSF: CkeyValuePair4Spriteframe = this.sfOSList[i];
            if (Number(oType) == Number(kvSF.key)) {
                return kvSF.value;
            }
        }

        return null;
    }

    onClickChangeOverseer() {
        //TODO:目前只有一种监工，以后在这里弹监工选择列表返回监工类型或ID
        const otype = eOverseerType.eotEyetyarnt;
        let icon: SpriteFrame = this.getOverseerIcon(otype);
        this.sprOSAvart.spriteFrame = icon;
        this.setOverseer(otype);
    }

    update(deltaTime: number) {

    }
}


