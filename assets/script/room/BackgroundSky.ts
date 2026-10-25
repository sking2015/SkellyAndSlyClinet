import { _decorator, Animation, AnimationClip, Component, instantiate, Node, tween, Tween, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

interface CloudFlight {
    node: Node;
    origin: Vec3;
    wait: number;
    flying: boolean;
}

interface BatStream {
    start: Vec3;
    end: Vec3;
    duration: number;
    remaining: number;
    wait: number;
}

@ccclass('CBackgroundSky')
export class CBackgroundSky extends Component {
    @property({ tooltip: '出现间隔下限（秒）' })
    minInterval = 5;

    @property({ tooltip: '出现间隔上限（秒）' })
    maxInterval = 20;

    @property({ tooltip: '云朵移动速度下限（像素/秒）' })
    minCloudSpeed = 20;

    @property({ tooltip: '云朵移动速度上限（像素/秒）' })
    maxCloudSpeed = 100;

    @property({ tooltip: '蝙蝠飞行时间下限（秒）' })
    minBatDuration = 2;

    @property({ tooltip: '蝙蝠飞行时间上限（秒）' })
    maxBatDuration = 3.5;

    private clouds: CloudFlight[] = [];
    private batTemplate: Node = null;
    private batOrigin: Vec3 = null;
    private batWait = 0;
    private bats = new Set<Node>();
    private batPool: Node[] = [];
    private batStreams: BatStream[] = [];

    protected onLoad() {
        this.clouds = this.node.children.filter(node => /^Cloud\d*$/i.test(node.name))
            .map(node => ({ node, origin: node.position.clone(), wait: 0, flying: false }));
        this.batTemplate = this.node.getChildByName('bat');
        this.batOrigin = this.batTemplate?.position.clone() || null;
    }

    protected onEnable() {
        for (const cloud of this.clouds) {
            cloud.node.active = false;
            cloud.node.setPosition(cloud.origin);
            cloud.flying = false;
            cloud.wait = this.nextInterval();
        }
        if (this.batTemplate) this.batTemplate.active = false;
        this.batWait = this.nextInterval();
    }

    private random(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private nextInterval(): number {
        const min = Math.max(0.1, this.minInterval);
        return this.random(min, Math.max(min, this.maxInterval));
    }

    private get bounds() {
        const transform = this.node.getComponent(UITransform);
        return {
            left: -transform.width * transform.anchorX,
            right: transform.width * (1 - transform.anchorX),
            top: transform.height * (1 - transform.anchorY),
        };
    }

    // 节点有缩放或非居中锚点时，也保证整张云朵在边界外开始/结束。
    private horizontalExtents(node: Node) {
        const transform = node.getComponent(UITransform);
        if (!transform) return { left: 0, right: 0 };
        const a = -transform.width * transform.anchorX * node.scale.x;
        const b = transform.width * (1 - transform.anchorX) * node.scale.x;
        return { left: Math.min(a, b), right: Math.max(a, b) };
    }

    private flyCloud(cloud: CloudFlight) {
        const bounds = this.bounds;
        const extents = this.horizontalExtents(cloud.node);
        const startX = bounds.left - extents.right - 1;
        const endX = bounds.right - extents.left + 1;
        const minSpeed = Math.max(1, this.minCloudSpeed);
        const speed = this.random(minSpeed, Math.max(minSpeed, this.maxCloudSpeed));
        cloud.flying = true;
        cloud.node.setPosition(startX, cloud.origin.y, cloud.origin.z);
        cloud.node.active = true;
        tween(cloud.node).to((endX - startX) / speed, {
            position: new Vec3(endX, cloud.origin.y, cloud.origin.z)
        }).call(() => {
            cloud.node.active = false;
            cloud.flying = false;
            cloud.wait = this.nextInterval();
        }).start();
    }

    private spawnBats() {
        if (!this.batTemplate) return;
        const bounds = this.bounds;
        const extents = this.horizontalExtents(this.batTemplate);
        const left = bounds.left - extents.left;
        const right = Math.max(left, bounds.right - extents.right);
        const count = 1 + Math.floor(Math.random() * 3);
        // 分段随机，确保同一批蝙蝠的出生 X 不重合。
        const segment = (right - left) / count;
        for (let index = 0; index < count; index++) {
            const startX = left + segment * (index + this.random(0.1, 0.9));
            const endX = this.random(left, right);
            const minDuration = Math.max(0.1, this.minBatDuration);
            const stream: BatStream = {
                start: new Vec3(startX, this.batOrigin.y, this.batOrigin.z),
                end: new Vec3(endX, bounds.top + 100, this.batOrigin.z),
                duration: this.random(minDuration, Math.max(minDuration, this.maxBatDuration)),
                remaining: 2 + Math.floor(Math.random() * 4),
                wait: 0.2,
            };
            // 第一只立即出现，后续蝙蝠复用同一条路径和飞行时间。
            this.spawnBat(stream);
            stream.remaining--;
            this.batStreams.push(stream);
        }
    }

    private spawnBat(stream: BatStream) {
        const bat = this.batPool.pop() || instantiate(this.batTemplate);
        bat.name = 'FlyingBat';
        const scale = this.batTemplate.scale;
        // 每次取出都重设朝向，避免沿用上一次飞行的翻转状态。
        bat.setScale(stream.end.x < stream.start.x ? -Math.abs(scale.x) : Math.abs(scale.x), scale.y, scale.z);
        bat.setPosition(stream.start);
        bat.parent = this.node;
        bat.active = true;
        this.bats.add(bat);
        const animation = bat.getComponent(Animation);
        const clip = animation?.defaultClip || animation?.clips[0];
        if (clip) {
            const state = animation.getState(clip.name);
            if (state) state.wrapMode = AnimationClip.WrapMode.Loop;
            animation.play(clip.name);
        }
        tween(bat).to(stream.duration, { position: stream.end.clone() })
            .call(() => this.recycleBat(bat)).start();
    }

    private updateBatStreams(deltaTime: number) {
        for (let index = this.batStreams.length - 1; index >= 0; index--) {
            const stream = this.batStreams[index];
            stream.wait -= deltaTime;
            if (stream.wait <= 0) {
                this.spawnBat(stream);
                stream.remaining--;
                stream.wait += 0.2;
                if (stream.remaining === 0) this.batStreams.splice(index, 1);
            }
        }
    }

    private recycleBat(bat: Node) {
        if (!this.bats.delete(bat)) return;
        Tween.stopAllByTarget(bat);
        bat.getComponent(Animation)?.stop();
        bat.active = false;
        this.batPool.push(bat);
    }

    update(deltaTime: number) {
        this.updateBatStreams(deltaTime);
        for (const cloud of this.clouds) {
            if (cloud.flying) continue;
            cloud.wait -= deltaTime;
            if (cloud.wait <= 0) this.flyCloud(cloud);
        }
        if (this.batTemplate) {
            this.batWait -= deltaTime;
            if (this.batWait <= 0) {
                this.spawnBats();
                this.batWait = this.nextInterval();
            }
        }
    }

    protected onDisable() {
        this.batStreams.length = 0;
        for (const cloud of this.clouds) {
            Tween.stopAllByTarget(cloud.node);
            cloud.node.active = false;
        }
        for (const bat of this.bats) {
            this.recycleBat(bat);
        }
    }
}
