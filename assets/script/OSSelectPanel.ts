import { _decorator, Component, instantiate, Node, Prefab, Sprite, Label, RichText } from 'cc';
import { CCharacterData, CGlobalData } from './GlobalData';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectBtn from './OSSelectBtn';
import { CCharacterID } from './BaseDef';
import { CResManager } from './ResManager';
import { COSCfgData, COSSkill, COverseerManager } from './OverseerMan';

const { ccclass, property } = _decorator;

@ccclass('OSSelectPanel')
export default class OSSelectPanel extends Component {
    @property({ type: Node, tooltip: "所有备选监工容器" })
    container: Node = null;

    @property({ type: Prefab, tooltip: "监工按钮预制件" })
    prefabOSBtn: Prefab = null;

    @property({ type: Sprite, tooltip: "监工全身像" })
    sprImg: Sprite = null;

    @property({ type: Label, tooltip: "监工名字" })
    lblOSName: Label = null;

    @property({ type: Label, tooltip: "监工描述" })
    lblOSDesc: Label = null;


    @property({ type: Sprite, tooltip: "技能图标" })
    sprSkillsIcon: Sprite[] = [];

    @property({ type: Label, tooltip: "技能名称" })
    lblSkillsName: Label[] = [];

    @property({ type: RichText, tooltip: "技能描述" })
    rtSkillsDesc: RichText[] = [];


    @property({ type: Node, tooltip: "监工信息节点，有选择监才显示这个" })
    nodeOverseer: Node = null;

    @property({ type: Node, tooltip: "空白信息节点，最开始没有选择监工时显示这个节点" })
    nodeBlank: Node = null;


    eCurOSType: CCharacterID = CCharacterID.eciNoe;

    //当前描述房间index
    nCurRoomIndex: number = -1;


    mapOSBtn: Map<CCharacterID, OSSelectBtn> = new Map();

    start() {
        this.initAllOverseer();
        this.refreshInfo();
    }

    refreshInfo() {

        this.refreshSelected();
        this.sprImg.spriteFrame = CResManager.instance.getCharAvatar(this.eCurOSType);

        const osData: COSCfgData = COverseerManager.instance.getOverseerData(this.eCurOSType);

        if (osData) {
            this.lblOSName.string = osData.name;
            this.lblOSDesc.string = osData.desc;

            for (let i = 0; i < this.sprSkillsIcon.length; ++i) {
                const skillData: COSSkill = osData.skills[i];
                if (skillData) {
                    this.sprSkillsIcon[i].spriteFrame = skillData.sfIcon;
                    this.lblSkillsName[i].string = skillData.getName();
                    this.rtSkillsDesc[i].string = `<outline color=#000000 width=2>${skillData.desc}</outline>`;
                } else {
                    this.lblSkillsName[i].string = '??????';
                    this.rtSkillsDesc[i].string = `<outline color=#000000 width=2>??????</outline>`;
                }
            }

            this.nodeBlank.active = false;
            this.nodeOverseer.active = true;
        } else {
            this.nodeBlank.active = true;
            this.nodeOverseer.active = false;
        }
    }

    startListnerEvent() {
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_click_overseer, this.onSelectOverseer, this);

    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_click_overseer, this.onSelectOverseer, this);
    }

    // protected onLoad(): void {
    //     this.startListnerEvent();
    // }

    onEnable() {
        this.startListnerEvent();
    }

    onDisable() {
        this.stopListnerEvent();
    }

    onSelectOverseer(event: CustomEvent) {
        console.log("监工选择面板触发事件数据:", event);
        this.eCurOSType = event.detail.osType;

        this.refreshInfo();
    }

    refreshSelected() {
        this.mapOSBtn.forEach((comBtn: OSSelectBtn, eType: CCharacterID) => {
            comBtn.setSelect(this.eCurOSType === eType);
        })
    }

    initAllOverseer() {
        CGlobalData.instance.foreachOverseers((data: CCharacterData) => {
            console.log("看一下初始化overseer", data);
            const btnOS = instantiate(this.prefabOSBtn);
            const comOSBtn = btnOS.getComponent(OSSelectBtn);
            comOSBtn.setOverseer(data);
            this.container.addChild(btnOS);
            this.mapOSBtn.set(data.eType, comOSBtn);
        })
    }

    onClickConfirm() {
        //TODO:这里需要先调用网络调用通知服务器某个房间已经确认更换监工，目前先直接换
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_change_overseer, true, { roomIdx: this.nCurRoomIndex, eOSType: this.eCurOSType }))
        this.onClose();
    }

    setRoomIndex(idx: number) {
        this.nCurRoomIndex = idx;
        this.eCurOSType = CGlobalData.instance.getRoomOSTypeByIndex(idx);
        this.refreshInfo();
    }

    onOpen() {
        this.node.active = true;
    }

    onClose() {
        this.node.active = false;
    }

    update(deltaTime: number) {

    }
}


