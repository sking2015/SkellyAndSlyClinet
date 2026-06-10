
import { tween, UIOpacity, Animation, Component } from "cc";
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

export function waitFadeInout(node: Node, duration: number, bIn: boolean): Promise<void> {
    return new Promise((resolve) => {
        fadeInOut(node, duration, bIn, () => {
            resolve();
        });
    });
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

export function formatCompactNumber(num: number, digits: number = 1): string {
    // 处理非有限数字（如 NaN, Infinity）
    if (!Number.isFinite(num)) return num.toString();

    // 定义单位映射表
    const lookup = [
        { value: 1e12, symbol: "T" },
        { value: 1e9, symbol: "B" },
        { value: 1e6, symbol: "M" },
        { value: 1e3, symbol: "K" }
    ];

    // 正负号处理
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    // 寻找匹配的单位
    const item = lookup.find(x => absNum >= x.value);

    if (item) {
        // 计算缩写后的数值
        const fraction = absNum / item.value;

        // 使用正则移除末尾无意义的 .0
        const formatted = fraction.toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");

        return `${isNegative ? '-' : ''}${formatted}${item.symbol}`;
    }

    // 小于 1000 的数字原样返回（移除末尾多余零）
    return num.toString();
}

export function waitUntilAnimationFinished(animationComponent: Animation): Promise<void> {
    return new Promise((resolve) => {
        animationComponent.once(Animation.EventType.FINISHED, () => {
            resolve();
        });
    });
}

/**
 * 封装：基于 Cocos 调度器的安全延迟（比 setTimeout 更安全）
 */
export function delay(seconds: number, comNode: Component): Promise<void> {
    return new Promise((resolve) => {
        // 使用 scheduleOnce 可以确保组件被销毁时定时器自动取消，避免内存泄露和报错
        comNode.scheduleOnce(() => resolve(), seconds);
    });
}
