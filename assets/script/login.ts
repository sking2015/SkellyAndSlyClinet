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

        //马上开始预加载
        this.preloadMain();
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

    //为了完美显示当前加载进度，保存当前已经加载的资源
    nProgress: number = 0;
    bPreloaded: boolean = false;

    preloadMain() {
        const am = cc.assetManager;
        cc.director.preloadScene('Main',     // 1. 进度回调 (当前完成数, 总数, 当前条目)
            (completedCount: number, totalCount: number, item: cc.AssetManager.RequestItem) => {
                const progress = completedCount / totalCount;
                this.nProgress = progress > this.nProgress ? progress : this.nProgress;
                // console.log("实际加载进度", this.nProgress.toFixed(2));
                // console.log("加载资原", completedCount, totalCount, item.url, item.uuid);


                // // 2. 尝试从全局资源缓存中抓取已经解析好的资产名字
                // let cachedAsset: cc.Asset = cc.assetManager.assets.get(item.uuid);
                // let assetRealName = cachedAsset ? cachedAsset.name : "未解析完成";
                // let assetType = cachedAsset ? cachedAsset.constructor.name : "未知类型";

                // console.log(`[加载中 ${completedCount}/${totalCount}]`);
                // console.log(`-> UUID: ${item.uuid}`);
                // console.log(`-> 临时URL: ${item.url}`);
                // console.log(`-> 资产:`, cachedAsset);
                // console.log(`-> 内存资产名: %c${assetRealName}%c | 类型: %c${assetType}`, "color:green;font-weight:bold;", "", "color:blue;");

                // // 3. 如果能拿到具体对象，还能直接看它的关联关系（例如 SpriteFrame 会挂载 texture）
                // if (cachedAsset && cachedAsset.name) {
                //     console.log(`   -> 属于纹理: ${cachedAsset.name}`);
                // }
            },
            // 2. 完成回调
            (error: Error | null) => {
                if (error) {
                    console.error("场景预加载失败:", error);
                    return;
                }
                this.bPreloaded = true;
                console.log("场景预加载完成！现在可以安全切换场景了。");
            });
    }


    bStartLoading: boolean = false;
    nTimingProgress: number = 0;

    loadMainScene() {
        this.bStartLoading = true;
        this.nTimingProgress = 0;
        // 加载进度条修正：2秒内平滑走完进度条
        //如果预加载已经加载到这里了，用实际进度，如果预加载还没加载完，显示实际进度条
        //也就是说，进度条至少会显示两秒

        // const totalTime = 2.0; // 2秒
        // let elapsedTime = 0;

        // // 使用 update 回调来模拟进度条动画
        // const progressCallback = (dt: number) => {
        //     elapsedTime += dt;
        //     let progress = Math.min(elapsedTime / totalTime, 1.0);
        //     console.log("时间进度", progress.toFixed(2));
        //     progress = progress < this.nProgress ? progress : this.nProgress;
        //     console.log("最终显示进度", progress.toFixed(2));

        //     if (this.progressBar) {
        //         this.progressBar.progress = progress;
        //     }

        //     if (elapsedTime >= totalTime) {
        //         // 移除 update 回调
        //         this.unschedule(progressCallback);
        //         // 加载 Main 场景
        //         this.doLoadMainScene();
        //     }
        // };

        // this.schedule(progressCallback);
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
        if (this.bStartLoading) {
            this.nTimingProgress += deltaTime;
            let progress = this.nTimingProgress < this.nProgress ? this.nTimingProgress : this.nProgress;
            if (this.progressBar) {
                this.progressBar.progress = progress;
            }

            if (progress >= 1 && this.bPreloaded) {
                this.doLoadMainScene();
            }
        }
    }
}


