import { _decorator, Component, instantiate, Node, Prefab, math } from 'cc';
import { eRoomType, eMineBuffType, eOverseerType, eWorkerType } from './BaseDef';
import { CCharactor } from './charactor';


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


    //监工的角色对像
    charOverseer: CCharactor = null;

    roomType: eRoomType = eRoomType.ertNone; // 房间类型
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



    onClickSetting() {
        console.log("click setting");

        console.log("先用来测试一下设置监工");
        this.setOverseer(eOverseerType.eotEyetyarnt);
    }

    onClickResIcon() {
        console.log("click resIcon");
        this.addWorker(eWorkerType.ewtMiner);
    }

    update(deltaTime: number) {

    }
}


