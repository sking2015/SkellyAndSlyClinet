import { BattleSync } from './BattleSync';
import { CItem } from './Item';
import { game, Game } from 'cc';
import { gameStateMgr } from './GameStateMgr';
import { _decorator, Component, Node, ScrollView, Prefab, Label, Sprite, UITransform, Vec3, instantiate, isValid, PhysicsSystem2D, EPhysics2DDrawFlags } from 'cc';
import { CustomEvent, UniEvent } from './common/CustomEvent';
import OSSelectPanel from './OSSelectPanel';
import CRoomUpgradePanel from './RoomUpgradePanel';
import { CGlobalData } from './GlobalData';
import { ResourceShowArea } from './ResourceShowArea';
import { fadeInOut, initGlobalButtonCooldown, setNodeVisibleWithFade } from './common/common';
import { CMALPanel } from './MALPanel';
import { CTroopDeployPanel } from './TroopDeployPanel';
import { CMonsterDetailPanel } from './MonsterDetailPanel';
import { CCharactersManager } from './CharacaterMannager';
import { CTroopUpgrade } from './TroopUpgrade';
import { CItemsPanel } from './ItemsPanel';
import { UIItem } from './UIItem';
import { CItemManager } from './Item';
import { CResManager } from './ResManager';

import { Roomlist } from './Roomlist';
import { eRoomType, eTroopType } from './BaseDef';

const { ccclass, property } = _decorator;




@ccclass('main')
export class main extends Component {
    private lootFlyLayer: Node = null;
    private lootCollectQueue: { item: UIItem; target: Node }[] = [];
    private queuedLoot = new Set<UIItem>();
    private lootCollectCooldown = 0;

    private updateLootCollection(dt: number) {
        this.lootCollectCooldown = Math.max(0, this.lootCollectCooldown - dt);
        if (this.lootCollectCooldown > 0) return;
        while (this.lootCollectQueue.length) {
            const { item, target } = this.lootCollectQueue[0];
            if (!isValid(item, true) || !item.canQueueCollection || !isValid(target, true)) {
                this.lootCollectQueue.shift();
                this.queuedLoot.delete(item);
                continue;
            }
            // 等队首落地再启动，避免多个空中掉落落地时同时起飞。
            if (!item.isLootOnGround) return;
            this.lootCollectQueue.shift();
            this.queuedLoot.delete(item);
            item.collect(this.lootFlyLayer, target);
            this.lootCollectCooldown = 0.1;
            return;
        }
    }

    private randomLootX(center: number, min: number, max: number, radius: number, occupied: number[]): number {
        const distance = (x: number) => occupied.reduce((nearest, other) => Math.min(nearest, Math.abs(x - other)), Infinity);
        const localMin = Math.max(min, Math.min(max, center - radius));
        const localMax = Math.min(max, Math.max(min, center + radius));
        let best = localMin;
        let bestDistance = -1;
        // 优先落在英雄附近；附近拥挤时扩大到房间范围，不把越界落点夹到同一个边缘。
        for (let i = 0; i < 48; ++i) {
            const x = i < 24 ? localMin + Math.random() * (localMax - localMin) : min + Math.random() * (max - min);
            const gap = distance(x);
            if (gap >= 80) return x;
            if (gap > bestDistance) { best = x; bestDistance = gap; }
        }
        // 房间拥挤时选剩余空隙的中点，尽量避免图标完全重合。
        const points = [min, ...occupied.filter(x => x >= min && x <= max).sort((a, b) => a - b), max];
        for (let i = 0; i < points.length - 1; ++i) {
            const x = (points[i] + points[i + 1]) / 2;
            const gap = distance(x);
            if (gap > bestDistance) { best = x; bestDistance = gap; }
        }
        return best;
    }

    private onGatherPreview(event: CustomEvent) {
        const { roomType, balance, finished } = event.detail;
        if (finished) this.comResShowArea.endGatherPreview(roomType);
        else this.comResShowArea.beginGatherPreview(roomType, balance);
    }
    private onDropLoot(event: CustomEvent) {
        const { dropId, room, ground, start } = event.detail;
        try {
            const drops = event.detail.drops || CItemManager.getDrops(dropId);
            if (!drops.length) return;
            const prefab = CResManager.instance?.itemPrefab;
            if (!prefab?.data?.getComponent(UIItem)) throw new Error('掉落 Item prefab 未配置 UIItem');
            // 资源图标与顶部资源栏共用同一 SpriteFrame。
            const icons = drops.map(drop => 'resourceType' in drop
                ? this.comResShowArea.getLootResourceIcon(drop.resourceType)?.getComponent(Sprite)?.spriteFrame : null);
            if (drops.some((drop, index) => 'resourceType' in drop && !icons[index])) {
                throw new Error('掉落资源图标未配置');
            }
            const parent = room.nodeCharLayer as Node;
            const layer = parent.getComponent(UITransform);
            const groundPos = layer.convertToNodeSpaceAR(ground);
            const startPos = layer.convertToNodeSpaceAR(start);
            const bounds = room.tfBase as UITransform;
            const left = layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(
                new Vec3(-bounds.width * bounds.anchorX, 0, 0))).x;
            const right = layer.convertToNodeSpaceAR(bounds.convertToWorldSpaceAR(
                new Vec3(bounds.width * (1 - bounds.anchorX), 0, 0))).x;
            const margin = Math.min(40, Math.abs(right - left) / 2);
            const minX = Math.min(left, right) + margin;
            const maxX = Math.max(left, right) - margin;
            // 包含尚在下落的落点，避免连续击败多个英雄时相互堆叠。
            const occupied = parent.getComponentsInChildren(UIItem)
                .map(item => item.lootLandingPosition).filter(position => !!position).map(position => position.x);
            drops.forEach((drop, index) => {
                const x = this.randomLootX(groundPos.x, minX, maxX, Math.max(160, drops.length * 48), occupied);
                occupied.push(x);
                const end = new Vec3(x, groundPos.y, groundPos.z);
                const node = instantiate(prefab);
                node.setScale(node.scale.x * 0.75, node.scale.y * 0.75, node.scale.z);
                node.parent = parent;
                node.getComponent(UIItem).dropItem(drop, startPos, end, icons[index]);
            });
        } catch (error) {
            console.error(`[掉落] Dropid ${dropId}`, error);
        }
    }

    private onCollectLoot(event: CustomEvent) {
        const target = this.node.getChildByPath('MainButtons/Items Button');
        if (!target || !this.lootFlyLayer) {
            console.error('[掉落] 缺少背包按钮或飞行层');
            return;
        }
        // 点击任意战利品时收取全场；战斗结束事件仅结算该房间。
        const root: Node = event.detail.item ? this.node : event.detail.root;
        const items = root.getComponentsInChildren(UIItem);
        for (const item of items) {
            if (!item.canQueueCollection || this.queuedLoot.has(item)) continue;
            const destination = item.resourceType ? this.comResShowArea.getLootResourceIcon(item.resourceType) : target;
            this.queuedLoot.add(item);
            this.lootCollectQueue.push({ item, target: destination });
        }
        this.updateLootCollection(0);
    }

    @property({ type: Node, tooltip: "所有弹出面板底层遮罩" })
    nodeMask: Node = null;

    @property({ type: OSSelectPanel, tooltip: "监工选择面板" })
    comOSListPanel: OSSelectPanel = null;

    @property({ type: CRoomUpgradePanel, tooltip: "房间升级面板" })
    comRoomUpgradePanel: CRoomUpgradePanel = null;

    @property({ type: CMALPanel, tooltip: "炼金实验室面板" })
    comMALPanel: CMALPanel = null;

    @property({ type: CTroopDeployPanel, tooltip: "部队部署面板" })
    comTroopDeployPanel: CTroopDeployPanel = null;

    @property({ type: CTroopUpgrade, tooltip: "部队升级面板" })
    comTroopUpgradePanel: CTroopUpgrade = null;

    @property({ type: ResourceShowArea, tooltip: "资源显示区域组件" })
    comResShowArea: ResourceShowArea = null;

    @property({ type: CMonsterDetailPanel, tooltip: "魔物属性界面" })
    comMDPanel: CMonsterDetailPanel = null;

    private get comItemsPanel(): CItemsPanel {
        return this.node.getChildByPath('PopPanelLayer/ItemsPanel').getComponent(CItemsPanel);
    }

    @property({ type: Node, tooltip: "tips节点" })
    nodeTips: Node = null;

    @property({ type: Label, tooltip: "tips文本控件" })
    lblTips: Label = null;

    @property({ type: Node, tooltip: "tips背景节点" })
    nodeTipsBg: Node = null;


    @property(ScrollView)
    roomSV: ScrollView = null;

    @property(Roomlist)
    roomList: Roomlist = null;


    tipsQueue: string[] = [];


    bShowTips: boolean = false;
    private guardSelectionRoomIndex = -1;


    startListnerEvent() {
        this.node.on(UniEvent.on_gather_preview, this.onGatherPreview, this);
        this.node.on(UniEvent.on_drop_loot, this.onDropLoot, this);
        this.node.on(UniEvent.on_collect_loot, this.onCollectLoot, this);
        // 监听子节点冒泡上来的事件
        this.node.on(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.on(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.on(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.on(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.on(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.on(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.on(UniEvent.on_pop_tips, this.onPopTips, this);
        this.node.on(UniEvent.on_open_room_panel, this.onPopRoomFunPanel, this);
        this.node.on(UniEvent.on_close_room_panel, this.onCloseRoomFunPanel, this);
        this.node.on(UniEvent.on_click_char_ui, this.onPopMonsterDetailPanel, this);
        this.node.on(UniEvent.on_click_troop, this.onPopTroopDeployPanel, this);
        this.node.on(UniEvent.on_refresh_charInfo, this.refreshCharInfo, this);
        this.node.on(UniEvent.on_room_refresh, this.onRoomRefresh, this);
        this.node.on(UniEvent.on_open_chars_list, this.onPopCharsListPanel, this);
        this.node.on(UniEvent.on_room_configuration_locked, this.onRoomConfigurationLocked, this);
        this.node.on(UniEvent.on_open_troop_upgrade, this.onPopTroopUpgradePanel, this);

    }

    stopListnerEvent() {
        this.node.off(UniEvent.on_gather_preview, this.onGatherPreview, this);
        this.node.off(UniEvent.on_drop_loot, this.onDropLoot, this);
        this.node.off(UniEvent.on_collect_loot, this.onCollectLoot, this);
        this.node.off(UniEvent.on_open_ospanel, this.onPopOverseerPanel, this);
        this.node.off(UniEvent.on_change_overseer, this.onChangeOverseer, this);
        this.node.off(UniEvent.on_open_room_upgrade, this.onPopRoomUpgrade, this);
        this.node.off(UniEvent.on_click_room_upgrade, this.onRoomUpgrade, this);
        this.node.off(UniEvent.on_click_gather_res, this.onGatherRes, this);
        this.node.off(UniEvent.on_resource_change, this.refreshResource, this);
        this.node.off(UniEvent.on_pop_tips, this.onPopTips, this);
        this.node.off(UniEvent.on_open_room_panel, this.onPopRoomFunPanel, this);
        this.node.off(UniEvent.on_close_room_panel, this.onCloseRoomFunPanel, this);
        this.node.off(UniEvent.on_click_char_ui, this.onPopMonsterDetailPanel, this);
        this.node.off(UniEvent.on_click_troop, this.onPopTroopDeployPanel, this);
        this.node.off(UniEvent.on_refresh_charInfo, this.refreshCharInfo, this);
        this.node.off(UniEvent.on_room_refresh, this.onRoomRefresh, this);
        this.node.off(UniEvent.on_open_chars_list, this.onPopCharsListPanel, this);
        this.node.off(UniEvent.on_room_configuration_locked, this.onRoomConfigurationLocked, this);
        this.node.off(UniEvent.on_open_troop_upgrade, this.onPopTroopUpgradePanel, this);
    }

    private onResume = () => {
        this.comResShowArea.clearGatherPreviews();
        if (gameStateMgr.online) void gameStateMgr.syncState().then(reply => {
            if (reply.ok) return BattleSync.instance.recover();
        });
    };
    private unsubscribeLoot: () => void;
    private unsubscribeError: () => void;
    private unsubscribeState: () => void;
    onEnable() {
        game.on(Game.EVENT_SHOW, this.onResume, this);
        this.unsubscribeError = gameStateMgr.onError(code => {
            const messages = {
                NETWORK_ERROR: '网络异常，操作结果待确认，请重连后重试',
                PENDING_REQUEST: '上一笔操作尚未确认，请重连后重试',
                RECOVERED_PENDING: '已恢复上一笔操作，请确认最新数据后再操作',
                STATE_CONFLICT: '数据已更新，请重新确认操作',
                INSUFFICIENT_RESOURCE: '资源不足', INSUFFICIENT_ITEM: '道具不足',
                UNIT_BUSY: gameStateMgr.activeBattle
                    ? '服务器仍有未结束战斗，房间暂不可配置，请等待结算'
                    : '角色或房间正在使用中', CAPACITY_EXCEEDED: '容量不足',
            };
            this.node.dispatchEvent(new CustomEvent(UniEvent.on_pop_tips, true, {
                tips: messages[code] || `操作未完成：${code}`,
            }));
        });
        this.unsubscribeState = gameStateMgr.onState(() => this.comResShowArea.refreshResource());
        this.unsubscribeLoot = BattleSync.instance.onLoot((loot, char) => {
            if (!char?.room || !isValid(char.room.node, true)) return;
            const drops: any[] = loot.items.map(value => {
                const item = new CItem(); item.id = value.item_id; item.itemNum = value.count; return item;
            });
            for (const key of ['coin', 'food', 'soul']) {
                if (loot.resources[key] > 0) drops.push({ resourceType: key[0].toUpperCase() + key.slice(1), amount: loot.resources[key] });
            }
            const ground = char.room.nodeCharLayer.worldPosition.clone();
            this.onDropLoot(new CustomEvent(UniEvent.on_drop_loot, false, {
                drops, room: char.room, ground, start: ground.clone(),
            }));
        });
        this.startListnerEvent();
    }

    onDisable() {
        game.off(Game.EVENT_SHOW, this.onResume, this);
        this.unsubscribeState?.();
        this.unsubscribeError?.();
        this.unsubscribeLoot?.();
        this.stopListnerEvent();
    }

    refreshResource(event: CustomEvent) {
        this.comResShowArea.refreshResource();
    }

    onTroopUpgrade() {

    }

    onOpenItemsPanel() {
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comItemsPanel.Show(true);
    }

    onPopTroopUpgradePanel(event: CustomEvent) {
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comTroopUpgradePanel.Show(true);
        this.comTroopUpgradePanel.setTroopType(event.detail.ett);
        this.comTroopUpgradePanel.setBarrackRoom(event.detail.comBR);
    }

    onPopCharsListPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        this.guardSelectionRoomIndex = event.detail.roomIndex;
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comMALPanel.setSelectMode(true);
        this.comMALPanel.Show(true);
        this.comMALPanel.setCallBack4CharButton(event.detail.callback);

    }

    onGatherRes(event: CustomEvent) {
        console.log("onGatherRes", event.detail);
        this.comResShowArea.onGatherRes(event.detail.roomType, event.detail.amount, event.detail.srcNode);
    }

    onChangeOverseer(event: CustomEvent) {
        this.roomList.onChangeOverseer(event.detail.roomIdx, event.detail.eOSId);
    }

    onRoomRefresh(event: CustomEvent) {
        this.roomList.onRoomRefresh(event.detail.roomIdx);
    }

    onRoomUpgrade(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIdx)) return;
        this.roomList.onRoomUpgrade(event.detail.roomIdx);
    }

    onPopOverseerPanel(event: CustomEvent) {
        console.log("onPopOverseerPanel~~", event.detail.roomIdx);
        this.comOSListPanel.setRoomIndex(event.detail.roomIdx);
        this.comOSListPanel.onOpen();
    }

    onPopRoomUpgrade(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIdx)) return;
        this.comRoomUpgradePanel.canConfigure = () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIdx);
        this.comRoomUpgradePanel.setRoomIndex(event.detail.roomIdx);
        this.comRoomUpgradePanel.onOpen();
    }

    onCloseRoomFunPanel() {
        this.guardSelectionRoomIndex = -1;
        setNodeVisibleWithFade(this.nodeMask, false);
    }

    onRoomConfigurationLocked(event: CustomEvent) {
        const index = event.detail.roomIndex;
        if (this.comTroopDeployPanel.roomIndex === index && this.comTroopDeployPanel.node.active) {
            this.comTroopDeployPanel.Show(false);
        }
        if (this.guardSelectionRoomIndex === index) {
            this.comMALPanel.setCallBack4CharButton(null);
            this.comMALPanel.Show(false);
            this.onCloseRoomFunPanel();
        }
        if (this.comRoomUpgradePanel.nCurRoomIndex === index && this.comRoomUpgradePanel.node.active) {
            this.comRoomUpgradePanel.onClose();
        }
    }

    //打开房间功能面板
    onPopRoomFunPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        setNodeVisibleWithFade(this.nodeMask, true);
        console.log("onPopRoomFunPanel~~", event.detail.roomType, event.detail.roomIndex, event.detail.troopIndex);
        switch (event.detail.roomType) {
            case eRoomType.ertAlchemy:
                this.comMALPanel.setSelectMode(false);
                this.guardSelectionRoomIndex = -1;
                // this.comMALPanel.setCallBack4CharButton(null);
                this.comMALPanel.Show(true);
                break;
            case eRoomType.ertBattleRoom:
            case eRoomType.ertDoor:
            case eRoomType.ertCastleOutSide:
                this.comTroopDeployPanel.Show(true);
                this.comTroopDeployPanel.setInfo(event.detail.roomIndex, event.detail.troopIndex,
                    () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIndex));
                break;
            default:
                console.log("不认识的房间类型")
        }
    }

    //打开部队部署面板
    onPopTroopDeployPanel(event: CustomEvent) {
        if (this.roomList.isRoomConfigurationLocked(event.detail.roomIndex)) return;
        setNodeVisibleWithFade(this.nodeMask, true);
        this.comTroopDeployPanel.Show(true);
        let nTroopIndex: number = Number(event.detail.troopIndex);
        this.comTroopDeployPanel.setInfo(event.detail.roomIndex, nTroopIndex as eTroopType,
            () => !this.roomList.isRoomConfigurationLocked(event.detail.roomIndex));
    }

    //打开魔物属性界面
    onPopMonsterDetailPanel(event: CustomEvent) {
        setNodeVisibleWithFade(this.nodeMask, true);
        //this.comMDPanel.setCharID(event.detail.charID);
        this.comMDPanel.setChar(event.detail.data);
        this.comMDPanel.ShowFromOther(event.detail.panel);
    }

    refreshCharInfo(event: CustomEvent) {
        console.log("refreshCharInfo~~", event.detail.charID, event.detail.data);
        this.comMALPanel.refreshCharButton(event.detail.charID);
    }


    onPopTips(event: CustomEvent) {
        this.tipsQueue.push(event.detail.tips);
    }

    popOneTips() {
        if (this.tipsQueue.length === 0) {
            return;
        }

        if (this.bShowTips) {
            return;
        }

        const tips = this.tipsQueue.shift();
        console.log("onPopTips~~", tips);
        this.bShowTips = true;
        this.nodeTips.active = true;

        this.lblTips.string = tips;

        this.scheduleOnce(() => {
            this.nodeTipsBg.getComponent(UITransform).height = this.lblTips.node.getComponent(UITransform).height + 20;
        }, 0.1);


        fadeInOut(this.nodeTips, 0.3, true, () => {
            this.scheduleOnce(() => {
                fadeInOut(this.nodeTips, 0.3, false, () => {
                    this.bShowTips = false;
                });
            }, 2);

        });
    }

    protected onLoad(): void {
        initGlobalButtonCooldown();
        this.lootFlyLayer = new Node('LootFlyLayer');
        this.lootFlyLayer.layer = this.node.layer;
        this.lootFlyLayer.addComponent(UITransform);
        this.lootFlyLayer.parent = this.node;
    }

    start() {
        this.nodeTips.active = false;
        this.nodeMask.active = false;

        this.comMALPanel.Show(false);
        this.comMDPanel.Close();
        this.comTroopDeployPanel.Show(false);
        this.comItemsPanel.node.active = false;

        PhysicsSystem2D.instance.enable = true;

        CCharactersManager.instance.Init();

        // // 运行游戏后如果能看到绿色框，说明碰撞体大小和位置是对的
        // PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
        //     EPhysics2DDrawFlags.Pair |
        //     EPhysics2DDrawFlags.CenterOfMass |
        //     EPhysics2DDrawFlags.Shape;
    }

    update(deltaTime: number) {
        this.updateLootCollection(deltaTime);
        this.popOneTips();
    }
}


