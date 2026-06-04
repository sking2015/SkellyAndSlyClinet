
import { tween, UIOpacity } from "cc";
import { Node } from "cc";

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