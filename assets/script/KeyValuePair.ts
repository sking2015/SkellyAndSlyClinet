import { _decorator, SpriteFrame } from 'cc';
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



