import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CButtonCooldown')
export class CButtonCooldown extends Component {
    @property({ tooltip: '是否开启点击冷却' })
    enabledCooldown: boolean = true;

    @property({ tooltip: '冷却时间（毫秒）' })
    cooldownTime: number = 500;
}