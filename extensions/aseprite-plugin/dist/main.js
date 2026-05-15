"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
// @ts-ignore
const fs_extra_1 = require("fs-extra");
const package_json_1 = __importDefault(require("../package.json"));
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    openPanel() {
        Editor.Panel.open(package_json_1.default.name);
    },
    async processAsepriteFiles(uuid) {
        // 1. 获取 JSON 资产信息
        try {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
            if (!info)
                return;
            console.log('检测到 Aseprite 相关文件被点击:', info);
            // 1. 路径准备
            const jsonPath = info.file.endsWith('.json') ? info.file : info.file.replace('.png', '.json');
            const metaPath = info.file.endsWith('.png') ? `${info.file}.meta` : `${info.file.replace('.json', '.png')}.meta`;
            const imageDbPath = info.path.replace('.json', '.png');
            const aseData = JSON.parse((0, fs_extra_1.readFileSync)(jsonPath, 'utf8'));
            const metaData = JSON.parse((0, fs_extra_1.readFileSync)(metaPath, 'utf8'));
            // 2. 第一步：【自动化切图】
            // 我们要把 Aseprite 的坐标填进 .meta 的 subMetas 字段
            console.log('正在注入切图数据到 .meta...');
            const frames = aseData.frames;
            const frameKeys = Object.keys(frames);
            // 初始化 subMetas 对象
            metaData.userData.subMetas = {};
            frameKeys.forEach((key) => {
                const f = frames[key].frame;
                // 注意：Aseprite 坐标是以左上角为原点
                metaData.userData.subMetas[key] = {
                    "ver": "1.1.0",
                    "uuid": "", // 留空，Cocos 会自动生成
                    "raw": {
                        "trimType": "rect",
                        "trimThreshold": 1,
                        "rotated": false,
                        "offsetX": 0,
                        "offsetY": 0,
                        "trimX": f.x,
                        "trimY": f.y,
                        "width": f.w,
                        "height": f.h,
                        "rawWidth": f.w,
                        "rawHeight": f.h
                    },
                    "type": "sprite-frame"
                };
            });
            // 写回 .meta 文件
            (0, fs_extra_1.writeFileSync)(metaPath, JSON.stringify(metaData, null, 2));
            // 关键：通知 Cocos 重新导入图片（这步完成后，图片下就会出现碎图了）
            await Editor.Message.request('asset-db', 'reimport-asset', imageDbPath);
            console.log('切图完成，正在生成动画文件...');
            // 3. 第二步：【生成动画】
            // 重新查询刚才生成的子资源 UUID
            const subAssets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: `${imageDbPath}/*`,
            });
            const spriteFrames = subAssets.filter(a => a.type === 'cc.SpriteFrame');
            // 构建 keyframes (逻辑同前...)
            let currentTime = 0;
            const keyframes = spriteFrames.map((sf, index) => {
                const time = currentTime;
                const frameName = Object.keys(frames)[index];
                currentTime += frames[frameName].duration / 1000;
                return { time, value: { "__uuid__": sf.uuid } };
            });
            const animClip = {
                "__type__": "cc.AnimationClip",
                "_name": info.name.split('.')[0],
                "tracks": [{
                        "__type__": "cc.animation.ObjectTrack",
                        "path": { "components": [{ "__type__": "cc.animation.ComponentPath", "component": "cc.Sprite" }], "props": ["spriteFrame"] },
                        "channel": { "__type__": "cc.animation.Channel", "curve": { "assignSorted": true, "keyframes": keyframes } }
                    }],
                "_duration": currentTime,
            };
            const animUrl = imageDbPath.replace('.png', '.anim');
            await Editor.Message.request('asset-db', 'create-asset', animUrl, JSON.stringify(animClip, null, 2));
            console.log('恭喜！图集和动画全部处理完毕。');
        }
        catch (err) {
            console.error('自动化处理失败:', err);
        }
    }
};
/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
function load() { }
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
function unload() { }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQW9IQSxvQkFBMEI7QUFNMUIsd0JBQTRCO0FBMUg1QixhQUFhO0FBQ2IsdUNBQXVEO0FBQ3ZELG1FQUEwQztBQUMxQzs7O0dBR0c7QUFDVSxRQUFBLE9BQU8sR0FBNEM7SUFDNUQ7OztPQUdHO0lBQ0gsU0FBUztRQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFZO1FBQ25DLGtCQUFrQjtRQUNsQixJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQVEsQ0FBQztZQUN2RixJQUFJLENBQUMsSUFBSTtnQkFBRSxPQUFPO1lBRWxCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFM0MsVUFBVTtZQUNWLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ2pILE1BQU0s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QUM7Q0FDSixDQUFBO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsSUFBSSxLQUFLLENBQUM7QUFFMUI7OztHQUdHO0FBQ0gsU0FBZ0IsTUFBTSxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtaWdub3JlXHJcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XHJcbi8qKlxyXG4gKiBAZW4gUmVnaXN0cmF0aW9uIG1ldGhvZCBmb3IgdGhlIG1haW4gcHJvY2VzcyBvZiBFeHRlbnNpb25cclxuICogQHpoIOS4uuaJqeWxleeahOS4u+i/m+eoi+eahOazqOWGjOaWueazlVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcclxuICAgIC8qKlxyXG4gICAgICogQGVuIEEgbWV0aG9kIHRoYXQgY2FuIGJlIHRyaWdnZXJlZCBieSBtZXNzYWdlXHJcbiAgICAgKiBAemgg6YCa6L+HIG1lc3NhZ2Ug6Kem5Y+R55qE5pa55rOVXHJcbiAgICAgKi9cclxuICAgIG9wZW5QYW5lbCgpIHtcclxuICAgICAgICBFZGl0b3IuUGFuZWwub3BlbihwYWNrYWdlSlNPTi5uYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgcHJvY2Vzc0FzZXByaXRlRmlsZXModXVpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgLy8gMS4g6I635Y+WIEpTT04g6LWE5Lqn5L+h5oGvXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB1dWlkKSBhcyBhbnk7XHJcbiAgICAgICAgICAgIGlmICghaW5mbykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+ajgOa1i+WIsCBBc2Vwcml0ZSDnm7jlhbPmlofku7booqvngrnlh7s6JywgaW5mbyk7XHJcblxyXG4gICAgICAgICAgICAvLyAxLiDot6/lvoTlh4blpIdcclxuICAgICAgICAgICAgY29uc3QganNvblBhdGggPSBpbmZvLmZpbGUuZW5kc1dpdGgoJy5qc29uJykgPyBpbmZvLmZpbGUgOiBpbmZvLmZpbGUucmVwbGFjZSgnLnBuZycsICcuanNvbicpO1xyXG4gICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IGluZm8uZmlsZS5lbmRzV2l0aCgnLnBuZycpID8gYCR7aW5mby5maWxlfS5tZXRhYCA6IGAke2luZm8uZmlsZS5yZXBsYWNlKCcuanNvbicsICcucG5nJyl9Lm1ldGFgO1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZURiUGF0aCA9IGluZm8ucGF0aC5yZXBsYWNlKCcuanNvbicsICcucG5nJyk7XHJcblxyXG5cclxuICAgICAgICAgICAgY29uc3QgYXNlRGF0YSA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKGpzb25QYXRoLCAndXRmOCcpKTtcclxuICAgICAgICAgICAgY29uc3QgbWV0YURhdGEgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtZXRhUGF0aCwgJ3V0ZjgnKSk7XHJcblxyXG4gICAgICAgICAgICAvLyAyLiDnrKzkuIDmraXvvJrjgJDoh6rliqjljJbliIflm77jgJFcclxuICAgICAgICAgICAgLy8g5oiR5Lus6KaB5oqKIEFzZXByaXRlIOeahOWdkOagh+Whq+i/myAubWV0YSDnmoQgc3ViTWV0YXMg5a2X5q61XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmraPlnKjms6jlhaXliIflm77mlbDmja7liLAgLm1ldGEuLi4nKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IGFzZURhdGEuZnJhbWVzO1xyXG4gICAgICAgICAgICBjb25zdCBmcmFtZUtleXMgPSBPYmplY3Qua2V5cyhmcmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgLy8g5Yid5aeL5YyWIHN1Yk1ldGFzIOWvueixoVxyXG4gICAgICAgICAgICBtZXRhRGF0YS51c2VyRGF0YS5zdWJNZXRhcyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZnJhbWVLZXlzLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IGZyYW1lc1trZXldLmZyYW1lO1xyXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSP77yaQXNlcHJpdGUg5Z2Q5qCH5piv5Lul5bem5LiK6KeS5Li65Y6f54K5XHJcbiAgICAgICAgICAgICAgICBtZXRhRGF0YS51c2VyRGF0YS5zdWJNZXRhc1trZXldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidmVyXCI6IFwiMS4xLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBcInV1aWRcIjogXCJcIiwgLy8g55WZ56m677yMQ29jb3Mg5Lya6Ieq5Yqo55Sf5oiQXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyYXdcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRyaW1UeXBlXCI6IFwicmVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRyaW1UaHJlc2hvbGRcIjogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3RhdGVkXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm9mZnNldFhcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJvZmZzZXRZXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHJpbVhcIjogZi54LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRyaW1ZXCI6IGYueSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOiBmLncsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IGYuaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyYXdXaWR0aFwiOiBmLncsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmF3SGVpZ2h0XCI6IGYuaFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3ByaXRlLWZyYW1lXCJcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8g5YaZ5ZueIC5tZXRhIOaWh+S7tlxyXG4gICAgICAgICAgICB3cml0ZUZpbGVTeW5jKG1ldGFQYXRoLCBKU09OLnN0cmluZ2lmeShtZXRhRGF0YSwgbnVsbCwgMikpO1xyXG5cclxuICAgICAgICAgICAgLy8g5YWz6ZSu77ya6YCa55+lIENvY29zIOmHjeaWsOWvvOWFpeWbvueJh++8iOi/meatpeWujOaIkOWQju+8jOWbvueJh+S4i+WwseS8muWHuueOsOeijuWbvuS6hu+8iVxyXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIGltYWdlRGJQYXRoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+WIh+WbvuWujOaIkO+8jOato+WcqOeUn+aIkOWKqOeUu+aWh+S7ti4uLicpO1xyXG5cclxuICAgICAgICAgICAgLy8gMy4g56ys5LqM5q2l77ya44CQ55Sf5oiQ5Yqo55S744CRXHJcbiAgICAgICAgICAgIC8vIOmHjeaWsOafpeivouWImuaJjeeUn+aIkOeahOWtkOi1hOa6kCBVVUlEXHJcbiAgICAgICAgICAgIGNvbnN0IHN1YkFzc2V0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IGAke2ltYWdlRGJQYXRofS8qYCxcclxuICAgICAgICAgICAgfSkgYXMgYW55W107XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzcHJpdGVGcmFtZXMgPSBzdWJBc3NldHMuZmlsdGVyKGEgPT4gYS50eXBlID09PSAnY2MuU3ByaXRlRnJhbWUnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaehOW7uiBrZXlmcmFtZXMgKOmAu+i+keWQjOWJjS4uLilcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgICAgICAgY29uc3Qga2V5ZnJhbWVzID0gc3ByaXRlRnJhbWVzLm1hcCgoc2YsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gY3VycmVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmcmFtZU5hbWUgPSBPYmplY3Qua2V5cyhmcmFtZXMpW2luZGV4XTtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUaW1lICs9IGZyYW1lc1tmcmFtZU5hbWVdLmR1cmF0aW9uIC8gMTAwMDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHRpbWUsIHZhbHVlOiB7IFwiX191dWlkX19cIjogc2YudXVpZCB9IH07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYW5pbUNsaXAgPSB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuQW5pbWF0aW9uQ2xpcFwiLFxyXG4gICAgICAgICAgICAgICAgXCJfbmFtZVwiOiBpbmZvLm5hbWUuc3BsaXQoJy4nKVswXSxcclxuICAgICAgICAgICAgICAgIFwidHJhY2tzXCI6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLmFuaW1hdGlvbi5PYmplY3RUcmFja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicGF0aFwiOiB7IFwiY29tcG9uZW50c1wiOiBbeyBcIl9fdHlwZV9fXCI6IFwiY2MuYW5pbWF0aW9uLkNvbXBvbmVudFBhdGhcIiwgXCJjb21wb25lbnRcIjogXCJjYy5TcHJpdGVcIiB9XSwgXCJwcm9wc1wiOiBbXCJzcHJpdGVGcmFtZVwiXSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2hhbm5lbFwiOiB7IFwiX190eXBlX19cIjogXCJjYy5hbmltYXRpb24uQ2hhbm5lbFwiLCBcImN1cnZlXCI6IHsgXCJhc3NpZ25Tb3J0ZWRcIjogdHJ1ZSwgXCJrZXlmcmFtZXNcIjoga2V5ZnJhbWVzIH0gfVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBcIl9kdXJhdGlvblwiOiBjdXJyZW50VGltZSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGFuaW1VcmwgPSBpbWFnZURiUGF0aC5yZXBsYWNlKCcucG5nJywgJy5hbmltJyk7XHJcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIGFuaW1VcmwsIEpTT04uc3RyaW5naWZ5KGFuaW1DbGlwLCBudWxsLCAyKSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn5oGt5Zac77yB5Zu+6ZuG5ZKM5Yqo55S75YWo6YOo5aSE55CG5a6M5q+V44CCJyk7XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfoh6rliqjljJblpITnkIblpLHotKU6JywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAZW4gTWV0aG9kIFRyaWdnZXJlZCBvbiBFeHRlbnNpb24gU3RhcnR1cFxyXG4gKiBAemgg5omp5bGV5ZCv5Yqo5pe26Kem5Y+R55qE5pa55rOVXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbG9hZCgpIHsgfVxyXG5cclxuLyoqXHJcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cclxuICogQHpoIOWNuOi9veaJqeWxleaXtuinpuWPkeeahOaWueazlVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHsgfVxyXG4iXX0=