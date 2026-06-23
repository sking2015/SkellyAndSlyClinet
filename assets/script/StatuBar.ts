import { _decorator, Component, Node, ProgressBar, Color } from 'cc';
const { ccclass, property } = _decorator;

//状态栏，用这个类来描述HP&MP条
@ccclass('CStatuBar')
export class CStatuBar extends Component {
    @property({ type: ProgressBar, tooltip: "HP条" })
    hpBar: ProgressBar = null;

    @property({ type: ProgressBar, tooltip: "MP条" })
    mpBar: ProgressBar = null;

    curHP: number = 0;
    maxHP: number = 1;

    curMP: number = 0;
    maxMP: number = 1;

    setHP(hp: number) {
        this.curHP = hp;
        this.refreshHP();
    }

    setMaxHP(max: number) {
        this.maxHP = max;
    }

    setMP(mp: number) {
        this.curMP = mp;
        this.refreshMP();
    }

    setMaxMP(max: number) {
        this.maxMP = max;
    }

    getGradientColor(per: number): Color {
        // 处理边界情况
        let color: any;
        if (per >= 0.8) {
            color = { r: 0, g: 255, b: 0 };
        } else if (per <= 0.2) {
            color = { r: 255, g: 0, b: 0 };
        } else {

            let r: number, g: number;

            if (per >= 0.5) {
                // 0.5 ~ 0.8: 绿色满，红色变大
                g = 255;
                let t = (0.8 - per) / 0.3;
                r = Math.round(255 * t);
            } else {
                // 0.2 ~ 0.5: 红色满，绿色变小
                r = 255;
                let t = (per - 0.2) / 0.3;
                g = Math.round(255 * t);
            }

            // 线性插值计算颜色值并取整
            color = { r: r, g: g, b: 0 };
        }

        return new Color(color.r, color.g, color.b);
    }

    refreshHP() {
        // console.log("看下当下hp情况", this.curHP, this.maxHP);
        if (this.curHP != this.maxHP) {
            this.hpBar.node.active = true;
            const per = this.curHP / this.maxHP;

            this.hpBar.progress = per;
            this.hpBar.barSprite.color = this.getGradientColor(per);
        } else {
            this.hpBar.node.active = false;
        }

    }

    refreshMP() {
        if (this.curMP != this.maxMP) {
            this.mpBar.node.active = true;
            this.mpBar.progress = this.curMP / this.maxMP;
        } else {
            this.mpBar.node.active = false;
        }
    }

    start() {
        this.mpBar.node.active = false;
        this.hpBar.node.active = false;
    }

    update(deltaTime: number) {

    }
}


