# 大入侵实现与联调

客户端入口：`assets/script/MajorInvasionManager.ts`。界面挂在 `CastleOutSide.prefab` 的 `base/InvasionFrame` 下，包含恶名数字、ProgressBar、状态文字和手动开战按钮。宝箱使用 `assets/animation/chestOpen.anim`，引用 `frame/Chest/1–5.png`。

服务端已同步修改 `Server4SS/game`，并同步当前客户端 DropConfig。需要重新编译、重启服务端后运行客户端；本次没有替换或重启正在运行的服务进程。

## 已落实的规则

- 成功收取一次资源、成功召唤、成功喂养、生产一批士兵、小入侵胜利，各增加 10 点恶名。生产沿用现有服务端即时完成一批的结算方式，逐个跑出的士兵是客户端表现。房间升级、部队升级、魔物升级和突变没有额外增加恶名。
- 恶名上限 100；有小入侵时先等其结束。备战请求成功时清零，备战和大入侵过程中不累计下一轮恶名。
- 备战暂停资源产出和新收取，原有收取可以完成；允许配队、召唤、喂养、训练等操作。正式开战锁定所有房间和养成操作，兵营生产表现暂停。
- 按当前关卡严格匹配唯一 Major 队伍，重复配置或缺失配置均不随机、不回退。第 2 关通过后进入第 3 关，暂时显示后续关卡未配置。
- 已解锁房间按 index 从上到下推进。城外是第一层；没有驻军的房间也播放从左到右穿行。同一批敌人跨层保留存活编制、生命、法力。
- 士兵永久扣除死亡数量。已败领主本场不再出场，结束后恢复；存活守军也在整场结束后恢复生命和法力。
- 胜利关卡 +1，Major 的 DropID 为宝箱奖励，个体击杀掉落另外结算。失败仅扣全局六种资源各 10%，向下取整，保留个体掉落。不实现额外经验、首通奖励、连续失败削弱。
- 胜利先展示 Victory Title 和一次开箱动画，随后弹出奖励并自动飞入 LOOT/资源栏。联网奖励由服务器发放，动画不重复增加背包数量。

## 请求接口

沿用签名、版本、request_id 幂等和 `/api/battle` 路由。

| action | data | result |
| --- | --- | --- |
| `battle-major-prepare` | `{ team_id }` | `{ team_id, phase: "preparing" }` |
| `battle-major-start` | `{ team_id }` | `{ battle }`，冻结全楼层守军与敌军实例 |
| `battle-major-checkpoint` | `{ battle_id, room_index, phase, units, last_event_seq }` | `{ checkpoint }` |
| `battle-end` | 沿用现有字段，大入侵的 `termination_reason` 为 `elimination` | 胜利额外返回 `loot`，可用于宝箱展示 |

Checkpoint 的 phase 为 `entering / active / leaving`，units 为 `{ unit_instance_id, hp, mp }[]`。跨层不更换敌人的实例 ID。死亡、个体掉落仍走原有战斗事件接口。

`state.progress` 新增整数 `notoriety`、`major_pending`（0/1）、`major_team_id`。`active_battle` 新增 `invasion_type: "Major"`、`current_room_index`、`checkpoint`；每个战斗单位新增数值快照 `attributes`、`hp`、`mp`。旧存档缺省视为恶名 0。

## 恢复边界与验收

服务端保存备战状态、死亡事件、当前楼层及生命/法力快照。客户端每两秒及跨层时上传 checkpoint，登录后恢复最近已确认的快照；大入侵不会按小入侵超时规则自动判败。死亡事件沿用本地持久队列和幂等重试。

这不是逐帧录像恢复：中断时未确认的生命变化可能回到最近两秒内的快照，跑位会重新演出，技能冷却和飞行中的子弹不恢复。真实网络断线、进程强退以及 MongoDB 副本集持久化仍需实机联调。

建议在 Cocos 中依次验收：

1. 恶名 90 时完成一次操作，确认进入备战、采集停止、新收取被禁止、旧收取能完成。
2. 调整守军并进行喂养/召唤/练兵，确认开战使用最新编制；点击开始后所有房间不可操作。
3. 配置“城外有守军 → 空房 → 地下有守军”，检查镜头跟随、空房穿行及敌军生命保留。
4. 分别测试胜利、全军覆没、结算响应丢失；检查关卡、奖励与惩罚仅发生一次。
5. 备战重登、跨层后重登、死亡事件待确认时重登，检查没有复活已死单位。
6. 检查五帧开箱、奖励数字、自动收取和关闭按钮。

## 自动检查

- Cocos 声明下客户端类型检查：通过。
- `major-invasion.cjs`、`major-recovery.cjs`、`formation-retry.cjs`、`enemy-slots.cjs`、`network-protocol.cjs`、`room-configuration.cjs`：通过。
- 实际 Server4SS：`go test -buildvcs=false ./...` 通过。MongoDB 集成测试依赖 `MONGO_TEST_URI`，未配置时跳过。
- 旧 `minor-invasion.cjs` 仍使用缺少备战接口、按角色 ID 合并敌军的旧替身；旧 `skill-flow.cjs` 在连续攻击数值断言处失败（1800 / 1000）。本次未调整这两套旧测试的预期，也未修改相应技能规则。
- 尚未在 Cocos 编辑器中运行视觉验收。
