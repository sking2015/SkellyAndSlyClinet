
import { tween, Tween, UIOpacity, Animation, Component, UITransform, Vec3, isValid } from "cc";
import { Node } from "cc";
import { Button } from 'cc';
import { CButtonCooldown } from './ButtonCooldown';

// 采集与战利品共用：弹出、飞向资源栏、缩小。到达时立即结算数量。
export function flyResourceToIcon(node: Node, target: Node, onArrive: () => void, onComplete: () => void) {
    node.once(Node.EventType.NODE_DESTROYED, () => Tween.stopAllByTarget(node));
    const scale = node.scale.clone();
    const end = node.parent.getComponent(UITransform).convertToNodeSpaceAR(target.worldPosition);
    node.setScale(scale.x * 0.1, scale.y * 0.1, scale.z);
    tween(node).to(0.3, { scale }, { easing: 'backOut' })
        .to(0.5, { position: end }, { easing: 'expoOut' })
        .call(onArrive)
        .to(0.3, { scale: new Vec3(0, 0, scale.z) }, { easing: 'backIn' })
        .call(onComplete).start();
}

/**
 * 全局按钮点击冷却配置
 */
const BUTTON_COOLDOWN_TIME = 500; // 冷却时间，单位：毫秒

const fadeVisibility = new WeakMap<Node, boolean>();
const fadeShownOpacity = new WeakMap<Node, number>();

// 可反向打断的显隐过渡：从当前透明度继续，淡出完成后才停用节点。
export function setNodeVisibleWithFade(node: Node, visible: boolean, duration = 0.3) {
    if (!node || !isValid(node, true) || fadeVisibility.get(node) === visible) return;
    fadeVisibility.set(node, visible);
    const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    // 在首次过渡前记住编辑器配置，避免淡出或中途反向时丢失目标透明度。
    if (!fadeShownOpacity.has(node)) fadeShownOpacity.set(node, opacity.opacity);
    if (!node.active && !visible) return;
    Tween.stopAllByTarget(opacity);
    if (visible && !node.active) {
        opacity.opacity = 0;
        node.active = true;
    }
    tween(opacity).to(duration, { opacity: visible ? fadeShownOpacity.get(node) : 0 }).call(() => {
        if (!visible && isValid(node, true)) node.active = false;
    }).start();
}

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

declare module 'cc' {
    interface Button {
        /** 按钮冷却时间（毫秒），<=0 或 undefined 表示不冷却 */
        cooldownTime?: number;
        __lastClickTime?: number;
    }
}

export function initGlobalButtonCooldown() {
    // 保存原有的 _onTouchEnded 方法
    const originalTouchEnded = Button.prototype['_onTouchEnded'];

    // 重写该方法
    Button.prototype['_onTouchEnded'] = function (event) {
        if (!this.interactable || !this.enabledInHierarchy) {
            return;
        }

        // 获取节点上挂载的冷却配置组件
        const config = this.getComponent(CButtonCooldown);

        // 如果没有挂载组件，或者组件的 enabledCooldown 为 false，则直接放行
        if (!config || !config.enabledCooldown) {
            originalTouchEnded.call(this, event);
            return;
        }

        const now = Date.now();
        if (this.__lastClickTime && now - this.__lastClickTime < config.cooldownTime) {
            event.propagationStopped = true;
            return;
        }

        this.__lastClickTime = now;
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
