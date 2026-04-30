import { _decorator, Component, Node, Screen, UITransform, Sprite, Widget, view, ProgressBar, director, Button } from 'cc';
import { gameStateMgr } from './GameStateMgr';
import { LoginResult } from './GameConfig';
const { ccclass, property } = _decorator;

@ccclass('login')
export class login extends Component {
    @property(Node)
    ssBg: Node = null;

    @property(Node)
    nodeStart: Node = null;

    @property(ProgressBar)
    progressBar: ProgressBar = null;

    start() {
        this.fitScreen();

        // 初始化：隐藏进度条
        if (this.progressBar) {
            this.progressBar.node.active = false;
        }

        // 绑定按钮点击事件
        if (this.nodeStart) {
            const btn = this.nodeStart.getComponent(Button);
            if (btn) {
                btn.node.on(Button.EventType.CLICK, this.onClickLogin, this);
            }
        }
    }

    fitScreen() {
        if (!this.ssBg) {
            this.ssBg = this.node.getChildByName('ss_bg');
        }

        if (!this.ssBg) {
            console.warn('ss_bg node not found!');
            return;
        }

        const screenSize = view.getVisibleSize();
        const canvasSize = view.getDesignResolutionSize();

        let transform = this.ssBg.getComponent(UITransform);
        let sprite = this.ssBg.getComponent(Sprite);
        let widget = this.ssBg.getComponent(Widget);

        if (!transform) {
            transform = this.ssBg.addComponent(UITransform);
        }
        if (!sprite) {
            sprite = this.ssBg.addComponent(Sprite);
        }
        if (!widget) {
            widget = this.ssBg.addComponent(Widget);
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
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        widget.enabled = true;
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.horizontalCenter = 0;
        widget.verticalCenter = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;

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

        // 3. 调用 GameStateMgr 进行登录
        gameStateMgr.login((result: LoginResult, data?: any) => {
            if (result === LoginResult.SUCCESS) {
                console.log('Login successful, switching to Main scene...');
                // 登录成功，跳转 Main 场景
                this.loadMainScene();
            } else {
                console.log('Login failed with result:', result);
                // 开发期间，失败只打印日志
                if (result === LoginResult.FAIL) {
                    console.log('登录失败，请稍后重试');
                } else if (result === LoginResult.NETWORK_ERROR) {
                    console.log('网络错误，请检查网络连接');
                } else if (result === LoginResult.SERVER_ERROR) {
                    console.log('服务器错误，请稍后重试');
                }

                // 恢复登录按钮显示
                if (this.nodeStart) {
                    this.nodeStart.active = true;
                }
                if (this.progressBar) {
                    this.progressBar.node.active = false;
                }
            }
        });
    }

    loadMainScene() {
        director.preloadScene('Main', (completed: number, total: number) => {
            const progress = (completed / total) * 100;
            if (this.progressBar) {
                this.progressBar.progress = progress;
            }
        }, (error: Error | null) => {
            if (error) {
                console.error('Failed to preload Main scene:', error);
                return;
            }

            console.log('Main scene preloaded successfully');

            // 进度条走到 100%
            if (this.progressBar) {
                this.progressBar.progress = 100;
            }

            // 延迟一下让用户看到 100%，然后切换场景
            this.scheduleOnce(() => {
                director.loadScene('Main', (error: Error | null) => {
                    if (error) {
                        console.error('Failed to load Main scene:', error);
                    }
                });
            }, 0.3);
        });
    }

    update(deltaTime: number) {

    }
}


