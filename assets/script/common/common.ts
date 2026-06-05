
import { tween, UIOpacity } from "cc";
import { Node } from "cc";
import { Button } from 'cc';

/**
 * 全局按钮点击冷却配置
 */
const BUTTON_COOLDOWN_TIME = 500; // 冷却时间，单位：毫秒

export function fadeInOut(node: Node, duration: number, bIn: boolean, cb?: Function) {

    // 1. 获取或自动添加 UIOpacity 组件
    let uiOpacity = node.getComponent(UIOpacity);
    if (!uiOpacity) {
        uiOpacity = node.addComponent(UIOpacity);
    }

    const toOpacity = bIn ? 255 : 0;
    const fromOpacity = bIn ? 0 : 255;

    // 2. 将初始透明度设为 0（确保是从无到有淡入）
    uiOpacity.opacity = fromOpacity;
    tween(uiOpacity).to(duration, { opacity: toOpacity }, {
        onComplete: () => {
            if (cb) cb();
        }
    }).start();
}

//原始字符串行如 "你缺少资源 {0}, 还需要 {1} 个才能升级";
export function formatString(template: string, ...args: string[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
        const argIndex = parseInt(index, 10);
        return typeof args[argIndex] !== 'undefined' ? args[argIndex] : match;
    });
}


export function initGlobalButtonCooldown() {
    // 保存原有的 _onTouchEnded 方法
    const originalTouchEnded = Button.prototype['_onTouchEnded'];

    // 重写该方法
    Button.prototype['_onTouchEnded'] = function (event) {
        if (!this.interactable || !this.enabledInHierarchy) {
            return;
        }

        const now = Date.now();
        // 使用 __lastClickTime 变量记录在上一次点击的时间戳上
        if (this.__lastClickTime && now - this.__lastClickTime < BUTTON_COOLDOWN_TIME) {
            // 如果在冷却时间内，拦截事件，不执行后续逻辑
            event.propagationStopped = true;
            return;
        }

        // 记录本次点击时间
        this.__lastClickTime = now;

        // 调用原有的点击逻辑
        originalTouchEnded.call(this, event);
    };
}