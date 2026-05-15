import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

//用于序列化展示的键值对

@ccclass('CkeyValuePair')
export class CkeyValuePair {
    @property({ tooltip: '键' })
    key: string = '';

    @property({ tooltip: '值' })
    value: string = '';
}


