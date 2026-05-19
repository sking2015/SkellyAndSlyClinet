import { _decorator, Prefab, SpriteFrame, Enum } from 'cc';
import { eOverseerType } from './BaseDef';
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
Enum(eOverseerType);

@ccclass('COverseerCfg')
export class COverseerCfg {
    @property({ type: Enum(eOverseerType), tooltip: '监工的枚举类型' })
    eType: eOverseerType = eOverseerType.eotNone;

    @property({ type: SpriteFrame, tooltip: '监工对应的头像spriteframe' })
    sfHead: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '监工对应的全身像' })
    sfAvatar: SpriteFrame = null;

    @property({ type: Prefab, tooltip: '监工对应的角色动画prefab' })
    prefabRole: Prefab = null;
}


