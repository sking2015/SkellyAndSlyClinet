# 客户端关键操作同步协议设计

日期：2026-11-04。状态：供客户端与后端 Agent 对齐实现的设计稿，尚未实现新增协议。

## 1. 目标与已确认规则

客户端执行可能改变长期数据的关键操作时，发送操作请求；服务器验证、计算、持久化数据，返回权威快照；客户端最终用快照覆盖本地数据并刷新显示。客户端可保留动画期间的临时数值变化，但不能把临时余额、等级、随机结果作为服务器最终依据。

本轮覆盖房间、资源、监工/守卫配置、驻军、训练、部队升级、领主（当前代码称魔物）升级、喂养/突变及战斗关键事件与击杀掉落。

已确认：

- 资源房保留两次真实领取：开始动画前一次，动画结束后再一次，第二次领取动画期间新生产的资源并校准显示。
- 普通士兵死亡永久扣除数量；领主死亡只影响本场战斗，战斗结束恢复常态，可参加下一场。
- 同步战斗开始、敌方英雄被击杀、己方角色被击杀、战斗结束；为正确处理复活，增加角色复活结果事件。不发送移动、攻击、伤害、技能释放等过程。
- 仅处理击杀掉落；战斗结束额外奖励、任务、签到、邮件另案设计。
- 大入侵的特殊事件、目标、胜败条件暂不纳入本轮。
- 断线保留战斗，重连恢复服务器记录；超时判负，保留已确认的士兵损失和掉落。超时时长为服务端配置，不在客户端写死。

本文未给出现有服务端实现保证。新增接口、字段、返回结构均是双方需要按本文实现的目标协议。

## 2. HTTP 路由与协议清单

统一 JSON POST。沿用 `/api/login`、`/api/room`；新增分组路由如下。原先预留的 `/api/change_overseer` 不作为本稿目标路由，统一由 `/api/room` 的 action 处理。

| 路由 | action | 用途 | 现有客户端状态 |
| --- | --- | --- | --- |
| /api/login | 无 | 登录、获取 token 与完整存档 | 已有请求，需扩展返回 |
| /api/state | state-sync | 登录后刷新、重连、冲突恢复 | 新增 |
| /api/room | room-lv-up | 解锁/升级 | 已有，需补齐通用字段与覆盖逻辑 |
| /api/room | room-gather | 资源领取，两阶段各一次 | 已有，保留设计并补齐幂等 |
| /api/room | room-change-os | 任命/更换/撤下监工 | 只有预留定义 |
| /api/room | room-change-guard | 任命/更换/撤下守卫 | 新增 |
| /api/room | room-deploy-troops | 调整驻军 | 新增 |
| /api/troop | troop-train | 批量训练并入账 | 新增 |
| /api/troop | troop-level-up | 部队升级 | 新增 |
| /api/monster | monster-level-up | 已招募领主升级 | 新增 |
| /api/feed | feed-submit | 喂养并自动连续突变 | 新增 |
| /api/battle | battle-start | 建立战斗与参战快照 | 新增 |
| /api/battle | battle-enemy-hero-killed | 敌方英雄死亡及掉落结算 | 新增 |
| /api/battle | battle-own-unit-killed | 己方死亡及士兵损失 | 新增 |
| /api/battle | battle-unit-revived | 角色复活结果 | 新增 |
| /api/battle | battle-end | 校验并结束战斗 | 新增 |

当前背包无已确认的独立使用道具玩法，因此不实现泛化 item-use、增加道具或领取奖励接口；喂养消耗直接归 feed-submit。当前训练无持久化倒计时任务，0.2 秒出兵间隔按表现处理，因此不增加 train-claim。未来出现真实计时任务或独立道具用途时另行扩展。

## 3. 通用请求、响应与幂等

### 3.1 请求

除登录外：

```ts
interface RequestEnvelope<T> {
  protocol_version: 1;
  player_id: string;
  token: string;
  timestamp: number;       // Unix 秒，整数
  request_id: string;      // UUID，每个业务操作唯一
  state_version: number;   // 已接收的权威存档版本，非动画版本
  action: string;
  data: string;            // JSON.stringify(T)，沿用现有字符串格式
  sign: string;
}
```

签名目标规则：`MD5(player_id + token + timestamp + action + data + request_id + state_version + protocol_version + SECRET_KEY)`，小写十六进制。数字按十进制整数字符串拼接；data 必须使用线上原始字符串，服务端不能重新序列化后验签。SECRET_KEY 的具体值沿用既有双方配置，不在本文复制。新增字段已进入签名，双方必须同时升级；不要混用旧签名算法。签名不替代 token 身份校验，生产部署使用 HTTPS。

同一操作超时重试沿用 request_id 和原业务参数，可更新 timestamp/sign。禁止超时后换 request_id 再执行同一笔变更。服务端按 `(player_id, request_id)` 持久化去重；同 ID 不同 action/data 返回冲突。先完成身份和签名校验，再检查已处理请求；幂等命中应先于版本冲突判断，返回原业务结果，不重复随机、不重复扣费或发奖。

### 3.2 响应

```ts
interface ResponseEnvelope<R> {
  protocol_version: 1;
  code: string;           // 见错误码；目标协议不再使用旧 code === 0
  message: string;
  request_id: string;
  server_time: number;    // Unix 毫秒
  state_version: number;
  data: null | {
    state: PlayerState;   // 首期统一完整快照，避免局部合并遗漏
    result: R;            // 本次动画/事件专用信息
  };
}
```

成功 code 为 `OK`。业务失败无部分扣费；需要校准的错误可以携带最新 state，result 为错误详情。无法鉴权时 data 为 null。HTTP 网络错误与业务错误分开处理。

建议错误码：`INVALID_ARGUMENT`、`UNAUTHORIZED`、`TOKEN_EXPIRED`、`CONFIG_MISMATCH`、`STATE_CONFLICT`、`REQUEST_ID_CONFLICT`、`INSUFFICIENT_RESOURCE`、`INSUFFICIENT_ITEM`、`CAPACITY_EXCEEDED`、`CONDITION_NOT_MET`、`UNIT_BUSY`、`BATTLE_NOT_FOUND`、`BATTLE_CLOSED`、`EVENT_GAP`、`INVALID_BATTLE_EVENT`、`RESULT_MISMATCH`、`INTERNAL_ERROR`。

每个玩家的数据写操作需串行化/事务化。一个成功操作的扣费、发奖、版本更新、幂等记录一起提交；失败全部回滚。持久化变更递增 state_version；纯查询和无变化领取可保持版本。

普通养成操作要求版本匹配，否则返回 STATE_CONFLICT 和最新快照，客户端覆盖后重新确认业务意图。state-sync 不要求匹配。战斗事件按 battle_id/seq 校验，不因全局版本过期丢弃有效死亡事件。两次领取分别使用当时最新版本。

首期客户端按玩家串行发送变更；乱序返回不得覆盖更新版本。幂等重放可能返回较旧快照：result 仍用于确认请求，但 state_version 小于已应用版本时不得覆盖。相同版本的纯表现结果也必须按 request_id/event_id 去重。

## 4. 权威存档模型

以下为线上的 snake_case 字段，客户端集中转换到现有 CGlobalData/CFeedData；不要把现有类实例直接作为协议对象。

```ts
interface PlayerState {
  player_level: number;
  config_version: string;
  resources: { coin: number; wood: number; metal: number;
    crystal: number; food: number; soul: number };
  rooms: Array<{ index: number; room_type: number; level: number;
    storage: number; production_updated_at: number; // Unix 毫秒
    overseer_id: number; guard_id: number;
    soldier_num: number; archer_num: number; mage_num: number }>;
  monsters: Array<{ monster_id: number; level: number }>; // level > 0 表示已招募
  troops: {
    soldier: TroopState; archer: TroopState; mage: TroopState;
  };
  items: Array<{ item_id: number; count: number }>;
  feed: { model_id: number; mutation_level: number; mutation_type: number;
    mutation_points: number; beast_points: number; abyss_points: number;
    legion_points: number; flesh_points: number;
    attributes: Attributes };
  progress: { current_stage_id: number };
  active_battle: BattleState | null;
}
interface TroopState { level: number; capacity: number; available: number }
interface Attributes { HP: number; MP: number; ATK: number; DEF: number;
  INT: number; MDF: number; SPD: number; LCA: number }
```

兵力口径：available 是未驻扎兵力，总存活数量为 available 加所有房间对应驻军。capacity 约束该兵种总存活数量，训练不能因为已派驻而绕过容量。死亡按参战快照中的来源房间/未驻扎来源扣一次，不同时扣两个来源。若现有产品希望采用其他容量定义，双方须同步修改本节与客户端公式，不能各自解释。

资源、道具、兵数为非负安全整数；房间库存可为非负小数，计算精度双方统一，显示格式不影响结算。ID/枚举沿用 BaseDef.ts 与共享配置。空监工/守卫使用 0。完整快照数组是替换语义，缺失条目不能保留旧物品；对象引用由客户端适配层安全更新。领主常态属性来自等级/配置，战斗 HP 不写入永久领主数据。

## 5. 非战斗操作详细定义

### 5.1 登录与状态刷新

`POST /api/login` 请求 `{ protocol_version: 1, playerId: string, timestamp: number, request_id: string }`，timestamp 沿用现有登录的 Unix 毫秒。响应使用通用格式，result 为 `{ player_id, token }`，并返回完整 state。兼容现有 playerId 登录标识；此方式不是正式账号凭证，后续账号方案另案迁移。

`state-sync` 的 data 为 `{}`。服务器结算到当前时间的可派生生产状态，返回完整 state；如果活动战斗已超时，先按超时规则关闭，再返回结果。客户端在登录、重连、版本冲突、表现结束需校准时使用。

### 5.2 房间解锁与升级：room-lv-up

data：`{ room_index: number }`。

服务器根据当前等级决定解锁（0→1）或升级，校验房间、前置解锁、等级上限及配置费用；按旧配置结算生产后，扣费、升一级。result：`{ room_index, old_level, new_level, cost: ResourceAmounts }`。ResourceAmounts 为六种资源的部分映射，未出现字段视为 0。

客户端等待成功再播放解锁/升级动画；最终等级、费用余额均覆盖为 state。现有 RoomUpgradePanel 本地扣费与 BaseRoom 等级自增必须调整，避免覆盖后再次扣费/升级。

### 5.3 两次资源领取：room-gather

data：`{ room_index: number, gather_session_id: string, phase: 'start' | 'finish' }`。

gather_session_id 是一次领取表现会话 UUID；start/finish 使用同一会话 ID、不同 request_id。每个会话每阶段最多结算一次。finish 必须对应已成功的 start；同一房间只允许一个未完成会话。客户端禁止重复点击创建并行领取。遗失响应按原 request_id 重试。

每一阶段服务器均按自身时间结算可领取库存，将库存转入资源余额，并清零所领取库存；产量、容量、监工加成均取服务端配置，不接收客户端数量。生产满仓时停止累计，不在领取后补发满仓期间溢出产量。结算时更新时间锚点，保留不足一个生产周期的进度，不能因频繁请求丢失进度。

result：`{ room_index, gather_session_id, phase, resource_type: 'wood'|'metal'|'crystal', gathered_amount, stock_after, settled_at }`，settled_at 为 Unix 毫秒。

客户端流程：start 成功后，保留本地库存用于当前领取动画，逐步增加临时显示；缓存 start 的权威快照，不让库存被提前清零而打断动画。动画完成后发送 finish，最终覆盖 finish 返回的完整 state。第二次领取不是查询，也不是第一笔请求的重试，即使 gathered_amount 为 0 也成功。临时数值不能再次加到权威余额上。

断线/关闭页面不能阻止已确认 start 的入账；重连直接覆盖 state，并清理表现。服务端允许会话超时关闭（不回滚 start），后续可发起新会话；对过期 finish 返回状态冲突并附最新 state。客户端不必为补表现长期阻塞其他操作，但动画期间建议锁定同房间领取及资源消耗按钮，避免临时余额被用于付款。服务端始终按真实余额校验。

### 5.4 配置监工与守卫

- room-change-os：`{ room_index, overseer_id }`。
- room-change-guard：`{ room_index, guard_id }`。

0 表示撤下。验证已招募、房间类型、占用和战斗锁定；同一领主不能同时占据多个任职位置。已被其他位置占用时返回 UNIT_BUSY，不隐式移动；客户端先撤下再任命。变更监工前按旧增益结算生产，随后重算容量与产量；容量下降不销毁已存资源，库存高于新容量时停止生产直至降到容量以下。

result 返回变更后的 `{ room_index, overseer_id }` 或 `{ room_index, guard_id }`。客户端成功后播放入场并覆盖数据。

### 5.5 驻军：room-deploy-troops

data：`{ room_index, soldier_num, archer_num, mage_num }`，三个值都是目标数量、非增量。

服务器原子校验房间容量、各兵种可用数量和战斗锁定，按新旧差值更新 available 与驻军，不能部分成功。result 为该房间的新驻军数据。客户端调整滑块时不发请求，点击确认才发送。

### 5.6 训练：troop-train

data：`{ room_index, troop_type: 1|2|3, count: number }`，count 为正整数。

服务器验证兵营、兵种等级、总容量和当前训练配置费用，一次扣费并增加 count 个 available。result：`{ troop_type, count, cost }`。客户端保留逐个出兵动画，但不逐个请求/重复入账；中途关闭动画不丢已购买兵力。若日后改为真实训练时间，必须另行升级协议。

### 5.7 升级

- troop-level-up：data `{ troop_type: 1|2|3 }`，校验上限、前置和费用，升一级；result `{ troop_type, old_level, new_level, cost }`。
- monster-level-up：data `{ monster_id }`，仅允许已招募领主，校验配置费用和上限；result `{ monster_id, old_level, new_level, cost }`。

升级不得修改正在进行的战斗初始快照。首期对参战单位的升级/部署/任职变更统一返回 UNIT_BUSY，战斗结束再操作。

### 5.8 喂养与自动突变：feed-submit

data：`{ item_id: number, count: 1 }`，与当前每次喂养一个道具一致。

服务器验证道具及完整突变配置，事务内扣除一个道具，按 ItemFeedCfg 随机属性变化、累计四类指数及突变点，并循环完成可触发的所有阶段；不接收客户端随机属性、突变类型、模型 ID。配置缺失时全部失败，不扣道具。无独立领取、突变选择或动画完成确认请求。

与当前 FeedData.ts 保持一致：各属性从配置基础值的 50%～150% 区间等概率抽整数，负值保持减益方向；最小值 1、上限按当前阶段。四类指数最高值比次高值至少大 20 时选择该类型，否则混沌。每次突变消耗上一阶段所需点数，保留剩余点数和累计指数，按新阶段上限应用奖励，可连续突变。具体数值来自共享配置，不在后端自行重新定义。

result：`{ item_id, consumed_count: 1, feed_attribute_changes: Attributes, mutations: Array<{ from_level, to_level, mutation_type, model_id, attribute_changes: Attributes }> }`，变化字段允许负数/0，mutations 按触发顺序。state.feed 是全部结算后的最终状态；客户端按 result 播放属性变化、连续变身，最终覆盖 state，退出表现不回滚已提交结果。

## 6. 战斗协议

### 6.1 战斗开始：battle-start

data：`{ encounter_id: string }`。encounter_id 必须由服务器生成/认可并指向本轮支持的普通遭遇；不能让客户端提交任意敌军列表、掉落表或胜利条件。客户端如何触发普通遭遇可与现有玩法入口对接，大入侵专用生成逻辑不在本稿设计范围内。

服务器验证遭遇可开始、无其他活动战斗，保存双方完整参战快照并锁定相关配置。result 包含 `battle: BattleState`：

```ts
interface BattleState {
  battle_id: string;
  encounter_id: string;
  status: 'active' | 'won' | 'lost';
  started_at: number;      // Unix 毫秒
  expires_at: number;
  last_event_seq: number; // 已连续确认的事件，初始 0
  units: Array<{
    unit_instance_id: string; // 本场唯一，即使相同兵种也必须不同
    config_id: number;
    side: 'own'|'enemy';
    kind: 'soldier'|'lord'|'enemy_hero';
    troop_type: 1|2|3|null;
    source_room_index: number|null; // 士兵扣减来源；null 为 available
    alive: boolean;
    life_no: number;       // 初始 1，复活后递增
  }>;
  events: BattleEventRecord[]; // 本场已确认记录，供重连核对
}
```

服务器持有完整等级/属性/掉落来源快照，客户端需要的配置可由 config_id 与一致版本读取。BattleEventRecord 至少包含 event_id、seq、action、unit_instance_id、life_no、elapsed_ms、处理结果及对应 loot_id（如有）。当前稿仅支持上述单位类别；额外召唤单位必须先扩展服务器认可的实例规则，禁止临时上传未知实例。

### 6.2 通用事件字段与顺序

死亡/复活 data 公共字段：`{ battle_id, event_id, seq, unit_instance_id, life_no, elapsed_ms }`。死亡可附 `killer_unit_instance_id`，未知时省略；若提供必须属于本场。

event_id 为 UUID，seq 从 1 连续递增，elapsed_ms 为客户端相对开战毫秒数，仅供合理性校验，不作为可信服务器时间。life_no 指本次生命编号。事件必须先持久化到客户端待发送队列，再按 seq 发送；同一事件重试保持 event_id/request_id。

服务器仅接受下一个 seq；缺号返回 EVENT_GAP 与 expected_seq，客户端补发，不能直接丢弃。按 `(battle_id,event_id)` 和 `(battle_id,seq)` 持久化去重；相同序号不同事件拒绝。死亡只能对应当前存活生命，复活只能对应死亡生命；每次复活后 life_no 加一，防止再次死亡被误认为重复事件。

通用 result：`{ battle_id, event_id, accepted_seq, unit_instance_id, life_no, alive, loot?: LootSettlement }`。复活返回增加后的 life_no。

### 6.3 敌方英雄死亡：battle-enemy-hero-killed

验证单位 side=enemy、kind=enemy_hero、当前 alive。记录死亡并在同一事务按服务端英雄快照对应的 DropConfig 结算一次掉落，更新资源/背包。客户端不传奖励数量或 drop_id。

```ts
interface LootSettlement {
  loot_id: string;
  resources: { coin: number; food: number; soul: number };
  items: Array<{ item_id: number; count: number }>;
}
```

result.loot 用于生成掉落图标，动画拾取不再请求服务器且不再给权威数据加一次。客户端可延迟当前掉落的可见入账表现，但必须集中维护临时显示与权威快照；重连直接以权威存档为准，不因地面图标未拾取丢失奖励。即使战败，已确认掉落也保留。本轮不设计独立 loot-claim。

### 6.4 己方死亡：battle-own-unit-killed

验证 side=own、alive。普通 soldier：在记录死亡的同一事务从来源驻军或 available 永久扣 1，记录扣减凭据。lord：只记录本场死亡，不删除已招募状态、不降低永久等级。

客户端可以即时播放死亡，权威兵力以响应 state 为准；battle-end 不重复扣已处理损失。断线、超时、失败退出不会撤销已确认损失。

### 6.5 复活结果：battle-unit-revived

data 除公共字段外增加 `reviver_unit_instance_id: string`，公共 life_no 指被复活前的生命编号。

服务器核对本场死亡记录、施法者归属、参战快照中是否有相应复活能力及可记录的次数限制。无需上传技能释放过程；服务器只能作有限一致性检查，不能精确验证伤害/技能全过程。

当前确认支持 lord 复活，恢复本场 alive 并递增 life_no；普通士兵已定义死亡永久扣兵，首期拒绝士兵复活事件，不回补数量。若未来士兵也能复活，需要另行明确经济规则。敌方复活能力若存在也必须在遭遇配置中明确支持，否则拒绝。

### 6.6 战斗结束：battle-end

data：`{ battle_id, result: 'win'|'lose', duration_ms, last_event_seq }`。

只有全部事件已确认后才提交；服务端要求 last_event_seq 与已确认序号一致，否则 EVENT_GAP/INVALID_BATTLE_EVENT。按本场初始快照和已记录死亡/复活状态验证胜败：普通歼灭遭遇以敌方英雄全部死亡判胜，己方全部无法继续作战判负；同时达成时本稿约定优先判胜。遭遇若采用其他条件必须明确版本化规则后再支持，不能套用未完成的大入侵逻辑。

结算在 battle-end 执行，不在最后一条死亡事件立即关闭战斗，确保同一帧其余死亡事件可以先记录。结果不相符返回 RESULT_MISMATCH，保留记录并返回权威状态；客户端不能强行覆盖胜败。

成功关闭战斗、解除锁定；领主恢复常态。已结算士兵损失/击杀掉落不再重复处理。不发战斗结束额外奖励，不推进尚未定义的关卡奖励逻辑。result：`{ battle_id, outcome: 'win'|'lose', reason: 'elimination'|'timeout', losses: { soldier, archer, mage }, loot_summary: LootSettlement[] }`。汇总仅用于展示，不能重复入账。

### 6.7 断线与超时

客户端将 battle_id、待确认事件和已生成序号保存在持久化队列。断线重连先 state-sync，用 active_battle.events 对账，依次补发未确认事件。服务器状态不足以重建位置/血量等现场；本轮不承诺无缝续战。客户端若没有完整本地现场，可等待超时判负，不重新随机模拟并冒充原战斗。

服务器定时或读状态时按 expires_at 关闭超时战斗并解除锁定；未收齐的客户端事件不凭空推断。超时后新事件拒绝，已处理事件的幂等查询仍可返回原结果。未上报士兵死亡无法可靠推断，本轮只永久扣已确认死亡；此为轻量事件方案的验证边界。

## 7. 客户端统一覆盖与表现约束

1. WebSession 负责通用封装、签名、响应解析、错误分类；GameStateMgr 管理玩家请求串行化、权威版本、待确认操作队列与重连。
2. CGlobalData 增加完整 PlayerState 适配，覆盖资源、房间、领主、部队、物品、喂养、进度及活动战斗；现有 loadData 只加载资源/房间，不满足新协议。
3. 表现层只读权威数据或独立的临时展示值。不得在已应用快照之后再次本地扣费、升等级、加兵或加掉落。
4. 涉及长动画的领取/喂养/训练，缓存请求结果用于播放，最终采用当前最高版本权威快照；不能在动画回调覆盖成旧版本。失败或断线结束临时表现，重新同步。
5. 超时结果未知时保留 request_id 重试，不能按业务失败回滚并另起同一操作。版本冲突重新同步；token 过期重新登录后继续对账。
6. ONLY_DEBUG_CLINTE 必须明确区分离线模拟与联网模式；联网模式不得静默返回 SUCCESS/null，不得忽略服务端 state。调试数据不上传覆盖正式存档。

## 8. 后端配置来源与实现边界

共享配置以本仓库 assets/script/config 为参考：RoomConfig、RoomLvUpCfg、LumberMill、MetalWorkshop、CrystalMine、Troop_Produce、Troop_Upgrades、Monsters、OverseerBasicStats、OverseerSkill、ItemFeedCfg、MutStageCfg、MutEvaBonusCfg、MutLogic、DropConfig。实际费用、增益与解锁条件还需核对 ConfigInterface、RoomUpgradePanel、TroopUpgrade、MonsterDetailPanel、FeedData 等调用代码，不凭接口名称猜数值。

服务端使用同一版本的配置并在登录返回 config_version，配置不匹配时阻止相关变更，避免两边公式不同。当前模拟初始资源、道具和房间来自 GlobalData 的调试初始化，不应直接作为正式新玩家数值；正式初始存档由后端配置明确提供。

没有伤害/技能/移动同步时，只能检查实例身份、生命变化、能力约束、时间合理性、事件完整性及结果一致性，不能声称完整防作弊或战斗确定性验证。

## 9. 双方验收用例

- 同一个升级/训练/喂养请求重复提交，最多扣费一次、随机一次；同 ID 不同参数拒绝。
- 资源 start/finish 分别结算一次，两阶段间生产可被第二次领取；零库存成功；请求重试不重复领取；中途退出不丢第一次入账。
- 升级、更换监工按旧配置先结算；满仓无溢出补发；频繁同步不吞生产周期余量。
- 训练容量包含驻军；部署前后总兵力守恒；士兵死亡准确扣来源，结束/超时不二次扣兵。
- 领主死亡不失去招募状态；复活后再次死亡可记录；结束后恢复常态。
- 击杀事件重试不重复掉落；图标拾取不再次加奖；断线后存档仍含已确认掉落。
- 连续突变按服务器结果播放，退出动画仍保留完整消耗与结果；配置缺失完全回滚。
- 事件乱序返回缺失序号；补齐后才可结束；未知角色、重复生命死亡、错误胜败被拒绝。
- 旧版本/旧响应不覆盖新快照；过期 token 不变更存档；服务器重启后幂等与活动战斗记录仍可恢复。

## 10. 实施顺序

先完成通用信封/幂等/完整存档与 state-sync；然后改造既有升级和两次领取；再接配置、训练、升级与喂养；最后接战斗实例、事件队列、掉落和结束校验。客户端与后端同时升级协议版本/签名，联调后再启用联网模式。本稿不授权额外实现任务、签到、邮件、结束奖励或大入侵。
