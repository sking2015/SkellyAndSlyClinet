import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import { CCharData, CCharactersData } from './CharacatersData';
import { CCharButton } from './CharButton';
import { CGlobalData } from './GlobalData';
import { eCCharacterID } from './BaseDef';

const { ccclass, property } = _decorator;

@ccclass('CMALPanel')
export class CMALPanel extends Component {
    @property({ type: Prefab, tooltip: "魔物按钮预制件" })
    prefabCharButton: Prefab;

    @property({ type: Node, tooltip: "魔物列表容器节点" })
    nodeCharList: Node;


    private mapCharButton: Map<eCCharacterID, CCharButton> = new Map();

    start() {
    }

    update(deltaTime: number) {

    }

    Show(bShow: boolean) {
        this.node.active = bShow;
        if (bShow) {
            this.refreshShow();
        }
    }

    refreshCharButton(eCharId: eCCharacterID) {
        const comCharBtn: CCharButton = this.mapCharButton.get(eCharId);
        if (comCharBtn) {
            comCharBtn.refreshData();
        }
    }

    refreshShow() {
        this.nodeCharList.removeAllChildren();
        this.mapCharButton.clear();

        CGlobalData.instance.foreachMonsters((data: CCharData) => {
            const monster = instantiate(this.prefabCharButton);
            const comCharBtn: CCharButton = monster.getComponent(CCharButton);
            comCharBtn.setCharData(data);
            comCharBtn.SetParentPanel(this.node);
            monster.parent = this.nodeCharList;

            this.mapCharButton.set(data.ID, comCharBtn);
        })
    }

    OnClickClose() {
        this.node.dispatchEvent(new CustomEvent(UniEvent.on_close_room_panel, true));
        this.Show(false);
    }
}


