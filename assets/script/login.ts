//import { _decorator, Component, Node, Screen, UITransform, Sprite, Widget, view, ProgressBar, director, assetManager, AssetBundle, Prefab } from 'cc';

import * as cc from 'cc'
import { gameStateMgr } from './GameStateMgr';
import { SessionResult } from './GameConfig';
const { ccclass, property } = cc._decorator;

@ccclass('login')
export class login extends cc.Component {
    @property(cc.Node)
    ssBg: cc.Node = null;

    @property(cc.Node)
    nodeStart: cc.Node = null;

    @property(cc.Node)
    nodeLoadingText: cc.Node = null;

    @property(cc.ProgressBar)
    progressBar: cc.ProgressBar = null;

    start() {
        this.fitScreen();

        // 初始化：隐藏进度条
        if (this.progressBar) {
            this.progressBar.node.active = false;
        }

        if (this.nodeLoadingText) {
            this.nodeLoadingText.active = false;
        }

        // // 绑定按钮点击事件，这个在外面绑定了，这里就不绑定了
        // if (this.nodeStart) {
        //     const btn = this.nodeStart.getComponent(Button);
        //     if (btn) {
        //         btn.node.on(Button.EventType.CLICK, this.onClickLogin, this);
        //     }
        // }

    }



    fitScreen() {
        if (!this.ssBg) {
            this.ssBg = this.node.getChildByName('ss_bg');
        }

        if (!this.ssBg) {
            console.warn('ss_bg node not found!');
            return;
        }

        const screenSize = cc.view.getVisibleSize();
        const canvasSize = cc.view.getDesignResolutionSize();

        let transform = this.ssBg.getComponent(cc.UITransform);
        let sprite = this.ssBg.getComponent(cc.Sprite);
        let widget = this.ssBg.getComponent(cc.Widget);

        if (!transform) {
            transform = this.ssBg.addComponent(cc.UITransform);
        }
        if (!sprite) {
            sprite = this.ssBg.addComponent(cc.Sprite);
        }
        if (!widget) {
            widget = this.ssBg.addComponent(cc.Widget);
        }

        // 背景图原始尺寸
        const bgWidth = 768;
        const bgHeight = 1675;
        const bgRatio = bgWidth / bgHeight;

        // 屏幕尺寸
        const screenWidth = screenSize.x;
        const screenHeight = screenSize.y;

        // 始终让宽度撑满屏幕，然后计算需要的高度
        // 这样可以保证左右两边完全贴合屏幕
        const finalWidth = screenWidth;
        const finalHeight = screenWidth / bgRatio;

        transform.setContentSize(finalWidth, finalHeight);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        widget.enabled = true;
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.horizontalCenter = 0;
        widget.verticalCenter = 0;
        widget.alignMode = cc.Widget.AlignMode.ALWAYS;

        console.log(`Screen: ${screenWidth}x${screenHeight}, BG: ${finalWidth}x${finalHeight}`);
    }

    onClickLogin() {
        console.log('Login button clicked!');

        // 1. 隐藏登录按钮
        if (this.nodeStart) {
            this.nodeStart.active = false;
        }

        // 2. 显示进度条
        if (this.progressBar) {
            this.progressBar.node.active = true;
            this.progressBar.progress = 0;
        }

        if (this.nodeLoadingText) {
            this.nodeLoadingText.active = true;
        }

        // 3. 随机更换背景图
        this.loadRandomBgImage();

        // 4. 调用 GameStateMgr 进行登录
        gameStateMgr.login((result: SessionResult, data?: any) => {
            if (result === SessionResult.SUCCESS) {
                console.log('Login successful, switching to Main scene...');
                // 登录成功，跳转 Main 场景
                this.loadMainScene();
            } else {
                console.log('Login failed with result:', result);
                // 开发期间，失败只打印日志
                if (result === SessionResult.FAIL) {
                    console.log('登录失败，请稍后重试');
                } else if (result === SessionResult.NETWORK_ERROR) {
                    console.log('网络错误，请检查网络连接');
                } else if (result === SessionResult.SERVER_ERROR) {
                    console.log('服务器错误，请稍后重试');
                }

                // 恢复登录按钮显示
                if (this.nodeStart) {
                    this.nodeStart.active = true;
                }
                if (this.progressBar) {
                    this.progressBar.node.active = false;
                }
                if (this.nodeLoadingText) {
                    this.nodeLoadingText.active = false;
                }
            }
        });
    }

    loadMainScene() {
        // 模拟加载进度：2秒内平滑走完进度条
        const totalTime = 2.0; // 2秒
        let elapsedTime = 0;

        // 使用 update 回调来模拟进度条动画
        const progressCallback = (dt: number) => {
            elapsedTime += dt;
            const progress = Math.min(elapsedTime / totalTime, 1.0);

            if (this.progressBar) {
                this.progressBar.progress = progress;
            }

            if (elapsedTime >= totalTime) {
                // 移除 update 回调
                this.unschedule(progressCallback);
                // 加载 Main 场景
                this.doLoadMainScene();
            }
        };

        this.schedule(progressCallback);
    }

    loadRandomBgImage() {
        cc.log('Loading random background image...');
        const bgImages = ['loadingbg1/spriteFrame', 'loadingbg2/spriteFrame'];
        const randomIndex = Math.floor(Math.random() * bgImages.length);
        const randomImage = bgImages[randomIndex];

        cc.assetManager.loadBundle('loadings', (err: Error | null, bundle: cc.AssetManager.Bundle) => {
            if (err) {
                console.error('Failed to load loadings bundle:', err);
                return;
            }

            cc.log('Bundle loaded:', bundle);

            bundle.load(randomImage, cc.SpriteFrame, (err: Error | null, spriteFrame: cc.SpriteFrame) => {
                if (err) {
                    console.error('Failed to load background image:', err);
                    return;
                }

                if (this.ssBg) {
                    const sprite = this.ssBg.getComponent(cc.Sprite);
                    if (sprite) {
                        sprite.spriteFrame = spriteFrame;
                    }
                }
            });
        });
    }

    doLoadMainScene() {
        cc.director.loadScene('Main', (error: Error | null) => {
            if (error) {
                console.error('Failed to load Main scene:', error);
            }
        });
    }

    update(deltaTime: number) {

    }
}


