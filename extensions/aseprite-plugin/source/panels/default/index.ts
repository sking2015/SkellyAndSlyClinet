import { readFileSync } from 'fs-extra';
import { join } from 'path';
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('show');
        },
        hide() {
            console.log('hide');
        },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        btn: '#btn', // 必须对应 HTML 里的 id
    },
    methods: {
        hello() {
            if (this.$.app) {
                this.$.app.innerHTML = 'hello';
                console.log('[cocos-panel-html.default]: hello');
            }
        },
    },
    ready() {
        if (this.$.app) {
            this.$.app.innerHTML = 'Hello Cocos.';
            // panel.ts ready 函数中
            this.$.btn?.addEventListener('confirm', async () => {
                // 直接获取当前选中的资产 UUID 数组
                const selectedUuids = Editor.Selection.getSelected('asset');

                if (selectedUuids.length > 0) {
                    const uuid = selectedUuids[0]; // 取第一个选中的文件
                    console.log('检测到选中资产:', uuid);

                    // 发送给主进程处理
                    Editor.Message.send('aseprite-plugin', 'onAssetMenuClicked', uuid);
                } else {
                    console.warn('你还没在 Assets 面板选中任何 JSON 文件呢！');
                }
            });
        }
    },
    beforeClose() { },
    close() { },
});
