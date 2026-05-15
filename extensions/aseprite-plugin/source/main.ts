// @ts-ignore
import { readFileSync, writeFileSync } from 'fs-extra';
import packageJSON from '../package.json';
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    openPanel() {
        Editor.Panel.open(packageJSON.name);
    },

    async processAsepriteFiles(uuid: string) {
        // 1. 获取 JSON 资产信息
        try {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid) as any;
            if (!info) return;

            console.log('检测到 Aseprite 相关文件被点击:', info);

            // 1. 路径准备
            const jsonPath = info.file.endsWith('.json') ? info.file : info.file.replace('.png', '.json');
            const metaPath = info.file.endsWith('.png') ? `${info.file}.meta` : `${info.file.replace('.json', '.png')}.meta`;
            const imageDbPath = info.path.replace('.json', '.png');


            const aseData = JSON.parse(readFileSync(jsonPath, 'utf8'));
            const metaData = JSON.parse(readFileSync(metaPath, 'utf8'));

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
            writeFileSync(metaPath, JSON.stringify(metaData, null, 2));

            // 关键：通知 Cocos 重新导入图片（这步完成后，图片下就会出现碎图了）
            await Editor.Message.request('asset-db', 'reimport-asset', imageDbPath);
            console.log('切图完成，正在生成动画文件...');

            // 3. 第二步：【生成动画】
            // 重新查询刚才生成的子资源 UUID
            const subAssets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: `${imageDbPath}/*`,
            }) as any[];

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

        } catch (err) {
            console.error('自动化处理失败:', err);
        }
    }
}

/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export function load() { }

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() { }
