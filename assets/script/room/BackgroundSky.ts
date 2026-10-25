import { _decorator, Animation, AnimationClip, CCInteger, Component, instantiate, Node, tween, Tween, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

interface CloudFlight {
    node: Node;
    speed: number;
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
    @property({ tooltip: '蝙蝠批次出现间隔下限（秒）' })
    minInterval = 5;

    @property({ tooltip: '蝙蝠批次出现间隔上限（秒）' })
    maxInterval = 20;

    @property({ tooltip: '云朵移动速度下限（像素/秒）' })
    minCloudSpeed = 20;

    @property({ tooltip: '云朵移动速度上限（像素/秒）' })
    maxCloudSpeed = 100;

    @property({ type: CCInteger, displayName: '云朵数量', tooltip: '开场铺满天空并持续循环使用的云朵数量', min: 0 })
    cloudCount = 30;

    @property({ tooltip: '蝙蝠飞行时间下限（秒）' })
    minBatDuration = 2;

    @property({ tooltip: '蝙蝠飞行时间上限（秒）' })
    maxBatDuration = 3.5;

    @property({ displayName: '蝙蝠逐只刷新间隔', tooltip: '同一刷新点相邻两只蝙蝠的出现间隔（秒）', min: 0.01 })
    batSpawnInterval = 0.2;

    @property({ type: CCInteger, displayName: '每点蝙蝠数量下限', tooltip: '每个刷新点随机生成蝙蝠的最小数量', min: 1 })
    minBatsPerPoint = 2;

    @property({ type: CCInteger, displayName: '每点蝙蝠数量上限', tooltip: '每个刷新点随机生成蝙蝠的最大数量', min: 1 })
    maxBatsPerPoint = 5;

    @property({ type: CCInteger, displayName: '刷新点数量下限', tooltip: '每批蝙蝠随机生成刷新点的最小数量', min: 1 })
    minBatSpawnPoints = 1;

    @property({ type: CCInteger, displayName: '刷新点数量上限', tooltip: '每批蝙蝠随机生成刷新点的最大数量', min: 1 })
    maxBatSpawnPoints = 3;

    private clouds: CloudFlight[] = [];
    private cloudTemplates: Node[] = [];
    private cloudMinY = 0;
    private batTemplate: Node = null;
    private batOrigin: Vec3 = null;
    private batWait = 0;
    private bats = new Set<Node>();
    private batPool: Node[] = [];
    private batStreams: BatStream[] = [];

    protected onLoad() {
        this.cloudTemplates = this.node.children.filter(node => /^Cloud\d*$/i.test(node.name));
        if (this.cloudTemplates.length) {
            this.cloudMinY = Math.min(...this.cloudTemplates.map(node => node.position.y));
            this.clouds = this.cloudTemplates.map(node => ({ node, speed: 0 }));
        }
        this.batTemplate = this.node.getChildByName('bat');
        this.batOrigin = this.batTemplate?.position.clone() || null;
    }

    protected onEnable() {
        this.prepareClouds();
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

    private randomCount(minimum: number, maximum: number): number {
        const min = Math.max(1, Math.floor(minimum));
        const max = Math.max(min, Math.floor(maximum));
        return min + Math.floor(Math.random() * (max - min + 1));
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

    private prepareClouds() {
        if (!this.cloudTemplates.length) return;
        const count = Math.max(0, Math.floor(this.cloudCount));
        // 只在数量不足时创建，关闭再打开也继续复用已有云朵。
        while (this.clouds.length < count) {
            const template = this.cloudTemplates[this.clouds.length % this.cloudTemplates.length];
            const node = instantiate(template);
            node.name = 'FloatingCloud';
            node.parent = this.node;
            node.setSiblingIndex(this.cloudTemplates.length);
            this.clouds.push({ node, speed: 0 });
        }
        this.clouds.forEach((cloud, index) => {
            cloud.node.active = index < count;
            if (cloud.node.active) this.resetCloud(cloud, true);
        });
    }

    private resetCloud(cloud: CloudFlight, initial: boolean = false) {
        const bounds = this.bounds;
        const extents = this.horizontalExtents(cloud.node);
        const x = initial ? this.random(bounds.left, bounds.right) : bounds.left - extents.right - 1;
        const y = this.random(this.cloudMinY, Math.max(this.cloudMinY, bounds.top));
        const minSpeed = Math.max(1, this.minCloudSpeed);
        cloud.speed = this.random(minSpeed, Math.max(minSpeed, this.maxCloudSpeed));
        cloud.node.setPosition(x, y, cloud.node.position.z);
    }

    private spawnBats() {
        if (!this.batTemplate) return;
        const bounds = this.bounds;
        const extents = this.horizontalExtents(this.batTemplate);
        const left = bounds.left - extents.left;
        const right = Math.max(left, bounds.right - extents.right);
        const count = this.randomCount(this.minBatSpawnPoints, this.maxBatSpawnPoints);
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
                remaining: this.randomCount(this.minBatsPerPoint, this.maxBatsPerPoint),
                wait: Math.max(0.01, this.batSpawnInterval),
            };
            // 第一只立即出现，后续蝙蝠复用同一条路径和飞行时间。
            this.spawnBat(stream);
            stream.remaining--;
            if (stream.remaining > 0) this.batStreams.push(stream);
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
                stream.wait += Math.max(0.01, this.batSpawnInterval);
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
        const bounds = this.bounds;
        for (const cloud of this.clouds) {
            if (!cloud.node.active) continue;
            const position = cloud.node.position;
            const x = position.x + cloud.speed * deltaTime;
            const extents = this.horizontalExtents(cloud.node);
            if (x + extents.left > bounds.right) {
                this.resetCloud(cloud);
            } else {
                cloud.node.setPosition(x, position.y, position.z);
            }
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
            cloud.node.active = false;
        }
        for (const bat of this.bats) {
            this.recycleBat(bat);
        }
    }
}
