import { _decorator, Component, Node, Sprite, Label, SpriteFrame, assetManager, AssetManager, isValid } from 'cc';
import { CItem } from './Item';
const { ccclass, property } = _decorator;

@ccclass('UIItem')
export class UIItem extends Component {

    @property({ type: Sprite, tooltip: "图标sprite" })
    iconNode: Sprite = null;

    @property({ type: Label, tooltip: "数量标签" })
    numNode: Label = null;



    private iconLoadVersion: number = 0;

    loadItem(item: CItem) {
        const loadVersion = ++this.iconLoadVersion;
        this.iconNode.spriteFrame = null;
        this.numNode.string = item ? item.itemNum.toString() : '';
        if (!item) return;

        const config = item.config;
        if (!config || !config.icon_spr) {
            console.error(`Missing icon config for itemId: ${item.id}`);
            return;
        }

        const isCurrentLoad = () => isValid(this, true)
            && isValid(this.iconNode, true) && loadVersion === this.iconLoadVersion;
        const loadIcon = (bundle: AssetManager.Bundle) => {
            if (!isCurrentLoad()) return;

            // 图片的 SpriteFrame 是子资源，路径不包含 .png 扩展名。
            bundle.load(`${config.icon_spr}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (!isCurrentLoad()) return;
                if (err) {
                    console.error(`Failed to load sprite frame for itemId: ${item.id}, error: ${err}`);
                    return;
                }
                this.iconNode.spriteFrame = spriteFrame;
            });
        };

        const bundle = assetManager.getBundle('item');
        if (bundle) {
            loadIcon(bundle);
        } else {
            assetManager.loadBundle('item', (err, loadedBundle) => {
                if (!isCurrentLoad()) return;
                if (err) {
                    console.error('Failed to load item bundle:', err);
                    return;
                }
                loadIcon(loadedBundle);
            });
        }
    }

    start() {
    }

    update(deltaTime: number) {

    }
}


