import { _decorator, v3 } from 'cc';
import { CBaseRoom } from './BaseRoom';
const { ccclass } = _decorator;

@ccclass('CFeedRoom')
export class CFeedRoom extends CBaseRoom {
    // 使用预制件中的喂养房间布景，避免等级刷新覆盖它。
    // refreshRoomScenery() {
    // }

    // CloseExpand() {
    //     super.CloseExpand();
    //     // 被其他房间收起时也同步状态，下一次点击 setting 即可展开。
    //     this.bOpneExpandPanel = false;
    //     this.nodeSwitchExpand.scale = v3(1, 1, 1);
    // }
}


