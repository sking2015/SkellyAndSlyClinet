import { Ii18n, i18nData } from "./config/i18n";
import { formatString } from "./common/common";

export function getI18nText(id: string, ...args: string[]): string {
    const i18nEntry: Ii18n | undefined = i18nData[id];
    if (!i18nEntry) {
        console.warn(`i18n: No entry found for ID '${id}'`);
        return id; // 返回 ID 作为默认文本，方便调试
    }

    //先默认返回英文文本，如果需要支持多语言，可以根据当前语言环境返回不同的文本
    return formatString(i18nEntry.EN, ...args);
}
