import { _decorator, Prefab, SpriteFrame, Enum } from 'cc';
import { eRoomType, CCharacterID } from './BaseDef';
const { ccclass, property } = _decorator;

//用于序列化展示的键值对

@ccclass('CkeyValuePair')
export class CkeyValuePair {
    @property({ tooltip: '键' })
    key: string = '';

    @property({ tooltip: '值' })
    value: string = '';
}

@ccclass('CkeyValuePair4Spriteframe')
export class CkeyValuePair4Spriteframe {
    @property({ tooltip: '键' })
    key: string = '';

    @property({ type: SpriteFrame, tooltip: '对应的spriteframe' })
    value: SpriteFrame = null;
}

// 2. 使用 Enum 函数包裹并注册你的枚举
Enum(CCharacterID);

@ccclass('CCharacterCfg')
export class CCharacterCfg {
    @property({ type: Enum(CCharacterID), tooltip: '监工的枚举类型' })
    eType: CCharacterID = CCharacterID.eciNoe;

    @property({ type: SpriteFrame, tooltip: '监工对应的头像spriteframe' })
    sfHead: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '监工对应的全身像' })
    sfAvatar: SpriteFrame = null;

    @property({ type: Prefab, tooltip: '监工对应的角色动画prefab' })
    prefabRole: Prefab = null;
}


@ccclass('CRoomLv2Spriteframe')
export class CRoomLv2Spriteframe {
    @property({ tooltip: '房间等级' })
    level: Number = 0;

    @property({ type: SpriteFrame, tooltip: '对应的背景spriteframe' })
    Bg: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '对应的前景spriteframe' })
    Fg: SpriteFrame = null;
}


Enum(eRoomType);

@ccclass('CRoomType2Data')
export class CRoomType2Data {
    @property({ type: Enum(eRoomType), tooltip: '房间类型' })
    eRt: eRoomType = eRoomType.ertNone;

    @property({ type: Prefab, tooltip: '房间对应的prefab' })
    prefabRoom: Prefab = null;

    @property({ type: CRoomLv2Spriteframe, tooltip: '对应的类型的房间等级数据' })
    lvdata: CRoomLv2Spriteframe[] = [];

    @property({ type: Prefab, tooltip: '房间对应的工人prefab' })
    prefabWorker: Prefab = null;

    @property({ type: SpriteFrame, tooltip: '房间对应的资源spriteframe' })
    sfResourceIcon: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '房间对应的资源容量spriteframe' })
    sfResCapIcon: SpriteFrame = null;
}


