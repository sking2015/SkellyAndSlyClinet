// node tests/network-protocol.cjs [path/to/typescript.js]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../assets/script');
function loader(overrides, globals = {}) {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const exports = {}; cache.set(file, exports);
        const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
        }).outputText;
        vm.runInNewContext(code, { exports, console, setTimeout, clearTimeout, AbortController,
            ...globals, require(name) {
                if (name in overrides) return overrides[name];
                if (!name.startsWith('.')) throw new Error('Unexpected import ' + name);
                return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name + '.ts')));
            } }, { filename: file });
        return exports;
    }
    return load;
}
function storage() {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
async function main() {
    const localStorage = storage();
    let version = 0, coin = 100, failures = 0, businessWrites = 0;
    const processed = new Map(), calls = [], applied = [];
    const fixture = () => ({ config_version: '2026-11-04.1', resources: { coin } });
    const load = loader({
        cc: { director: { loadScene() {} } },
        './GlobalData': { CGlobalData: { instance: { loadState: state => applied.push(state.resources.coin) } } },
        'ts-md5': { Md5: { hashStr: value => crypto.createHash('md5').update(value).digest('hex') } },
    }, { localStorage, async fetch(url, options) {
        const body = JSON.parse(options.body); calls.push({ url, body });
        if (!url.endsWith('/api/login')) {
            const expected = crypto.createHash('md5').update(body.player_id + body.token + body.timestamp
                + body.action + body.data + body.request_id + body.state_version + 1
                + 'I want money~!money~!money~!Give me money~!').digest('hex');
            assert.equal(body.sign, expected);
            assert.ok(localStorage.getItem('protocol_pending_v1').includes(body.request_id), 'persist before send');
        }
        if (!processed.has(body.request_id)) {
            if (body.action && body.action !== 'state-sync') {
                assert.equal(body.state_version, version, 'serialized requests use latest version');
                --coin; ++version; ++businessWrites;
            }
            processed.set(body.request_id, { protocol_version: 1, request_id: body.request_id,
                code: 'OK', message: '', server_time: Date.now(), state_version: version,
                data: { state: fixture(), result: url.endsWith('/api/login')
                    ? { player_id: body.playerId, token: 'token' } : { accepted: true } } });
        }
        if (body.action && failures > 0) { --failures; throw new Error('Lost response after commit'); }
        return { ok: true, json: async () => processed.get(body.request_id) };
    } });
    const { GameConfig } = load('GameConfig.ts'); GameConfig.ONLY_DEBUG_CLINTE = false;
    const { gameStateMgr: mgr } = load('GameStateMgr.ts');
    assert.equal(await new Promise(resolve => mgr.login(resolve)), 0);
    const { actionRoute } = load('Protocol.ts');
    for (const [action, group] of [['room-gather', 'room'], ['troop-train', 'troop'],
        ['monster-recruit', 'monster'], ['feed-submit', 'feed'], ['battle-end', 'battle'], ['state-sync', 'state']]) {
        assert.equal(actionRoute(action), '/api/' + group);
    }
    await Promise.all([mgr.operation('troop-train', { count: 1 }), mgr.operation('room-lv-up', { room_index: 0 })]);
    assert.equal(businessWrites, 2);
    failures = 3;
    const unknown = await mgr.operation('feed-submit', { item_id: 1, count: 1 }, 'stable-id');
    assert.equal(unknown.code, 'NETWORK_ERROR');
    assert.equal(businessWrites, 3);
    assert.ok(localStorage.getItem('protocol_pending_v1').includes('stable-id'));
    const recovered = await mgr.operation('feed-submit', { item_id: 1, count: 1 }, 'stable-id');
    assert.equal(recovered.ok, true); assert.equal(businessWrites, 3);
    assert.equal(JSON.parse(localStorage.getItem('protocol_pending_v1')).length, 0);
    assert.equal(applied.at(-1), 97);
    // A stale replay cannot overwrite a newer snapshot.
    mgr.apply({ state_version: 0, data: { state: { resources: { coin: 9999 } } } });
    assert.equal(applied.at(-1), 97);
    const roomCalls = calls.filter(call => call.body.action === 'room-lv-up');
    assert.equal(typeof roomCalls[0].body.data, 'string');
    console.log('PASS: signing, routes, serial versions, persisted unknown outcomes, idempotent retry, stale snapshots');

    const battleStorage = storage();
    const units = [
        { unit_instance_id: 's1', config_id: 910, side: 'own', kind: 'soldier', source_room_index: 0, alive: true, life_no: 1 },
        { unit_instance_id: 's2', config_id: 910, side: 'own', kind: 'soldier', source_room_index: 0, alive: true, life_no: 1 },
        { unit_instance_id: 'lord', config_id: 1, side: 'own', kind: 'lord', source_room_index: 0, alive: true, life_no: 1 },
        { unit_instance_id: 'healer', config_id: 2, side: 'own', kind: 'lord', source_room_index: 0, alive: true, life_no: 1 },
        { unit_instance_id: 'hero', config_id: 1001, side: 'enemy', kind: 'enemy_hero', alive: true, life_no: 1 },
    ];
    const battle = { battle_id: 'b1', status: 'active', started_at: Date.now(), last_event_seq: 0, units, events: [] };
    const events = []; let failEnd = true;
    const fakeMgr = { online: true, playerId: 'p', activeBattle: null, get serverNow() { return Date.now(); },
        syncState: async () => ({ ok: true, result: { encounters: [{ encounter_id: 'e1', room_index: 0, team_id: 1, available_at: 0 }] } }),
        async operation(action, data, id) {
            if (action === 'battle-start') { this.activeBattle = battle; return { ok: true, result: { battle } }; }
            assert.ok(battleStorage.getItem('battle_events_v1').includes(id), 'event persisted before send');
            events.push({ action, data: { ...data }, id });
            if (action === 'battle-end' && failEnd) { failEnd = false; return { ok: false }; }
            if (action === 'battle-end') this.activeBattle = null;
            return { ok: true, result: action === 'battle-enemy-hero-killed' ? {
                loot: { loot_id: 'loot1', resources: { coin: 10, food: 0, soul: 0 }, items: [] },
            } : {} };
        } };
    const battleLoad = loader({ './GameStateMgr': { gameStateMgr: fakeMgr } }, { localStorage: battleStorage });
    const sync = battleLoad('BattleSync.ts').BattleSync.instance;
    assert.equal(await sync.start(0, 1), true);
    const first = { eCharId: 910 }, reserve = { eCharId: 910 }, lord = { eCharId: 1 }, hero = { eCharId: 1001 };
    sync.bind(first, 'own', 0); sync.bind(reserve, 'own', 0); sync.bind(lord, 'own', 0); sync.bind(hero, 'enemy', 0);
    const healer = { eCharId: 2 }; sync.bind(healer, 'own', 0);
    let lootCount = 0; sync.onLoot(() => ++lootCount);
    sync.died(first); sync.died(first); sync.died(reserve); sync.died(lord);
    sync.revived(lord, healer); sync.died(lord); sync.died(hero);
    await sync.flush();
    assert.deepEqual(events.map(e => e.data.seq), [1, 2, 3, 4, 5, 6]);
    assert.equal(events[0].data.unit_instance_id, 's1'); assert.equal(events[1].data.unit_instance_id, 's2');
    assert.equal(events[4].data.life_no, 2); assert.equal(lootCount, 1);
    assert.equal(await sync.end(true), false);
    assert.equal(await sync.end(true), true);
    const ends = events.filter(e => e.action === 'battle-end');
    assert.equal(ends[0].id, ends[1].id); assert.deepEqual(ends[0].data, ends[1].data);
    assert.equal(ends[0].data.last_event_seq, 6);
    assert.equal(battleStorage.getItem('battle_events_v1'), null);
    console.log('PASS: unique reserve instances, ordered deaths/revival, single loot notification, durable end retry');

    const stateLoad = loader({
        './CharacatersData': { CCharactersData: { instance: { GetCharData: (_id, level) => ({
            Level: level, calculateData() { this.calculated = true; },
        }) } } },
    });
    const global = stateLoad('GlobalData.ts').CGlobalData.instance;
    const room = (index, level) => ({ index, room_type: 1, level, storage: 12,
        overseer_id: 0, guard_id: 1, soldier_num: 3, archer_num: 0, mage_num: 0 });
    const attributes = { HP: 10, MP: 11, ATK: 12, DEF: 13, INT: 14, MDF: 15, SPD: 16, LCA: 17 };
    const state = {
        player_level: 5, config_version: '2026-11-04.1',
        resources: { coin: 1, wood: 2, metal: 3, crystal: 4, food: 5, soul: 6 },
        rooms: [room(1, 2), room(0, 1)], monsters: [{ monster_id: 1, level: 4 }],
        troops: { soldier: { level: 2, capacity: 20, available: 7 },
            archer: { level: 1, capacity: 20, available: 2 }, mage: { level: 1, capacity: 20, available: 1 } },
        items: [{ item_id: 1001, count: 2 }],
        feed: { model_id: 100, mutation_level: 0, mutation_type: 0, mutation_points: 9,
            beast_points: 8, abyss_points: 7, legion_points: 6, flesh_points: 5, attributes },
        progress: { current_stage_id: 3 }, active_battle: null,
    };
    global.loadState(state);
    assert.equal(global.nCoin, 1); assert.equal(global.nSoldierLevel, 2);
    assert.equal(global.nSoldierLeft, 7); assert.equal(global.getSoldierCanTrainNum(), 7);
    assert.equal(global.getRoomDataByIndex(0).level, 1, 'wire array order is not an index');
    assert.equal(global.getMonsterLevel(1), 4); assert.equal(global.getMonsterLevel(2), 0);
    assert.equal(global.mgrItem.getItem(1001).itemNum, 2);
    assert.equal(global.mgrItem.getItem(1002).itemNum, 0, 'absent inventory cannot retain debug quantities');
    assert.equal(global.dataFeed.HP, 10); assert.equal(global.dataFeed.mutPoints, 9);
    assert.equal(global.playerLevel, 5); assert.equal(global.nCurStageId, 3);
    console.log('PASS: complete authoritative save, unordered room IDs, inventory replacement, deployed troop capacity');

    const gatherCalls = [], gatherEvents = [];
    const gatherGlobal = { nWood: 100, getRoomStockByIndex: () => 0 };
    const gatherLoad = loader({
        cc: { _decorator: { ccclass: () => value => value, property: () => () => {} } },
        './BaseRoom': { CBaseRoom: class {} },
        '../GameStateMgr': { gameStateMgr: { online: true, async operation(action, data) {
            gatherCalls.push({ action, data });
            return { ok: true, result: { gathered_amount: 40 } };
        } } },
        '../GlobalData': { CGlobalData: { instance: gatherGlobal } },
        '../OverseerMan': {}, '../common/common': {}, '../ResManager': {}, '../ConfigInterface': {},
        '../character/character': {},
        '../common/LabelGradient': {}, '../CharacaterMannager': {},
        '../common/CustomEvent': { CustomEvent: class { constructor(type, _bubbles, detail) {
            this.type = type; this.detail = detail;
        } }, UniEvent: { on_gather_preview: 'preview', on_click_gather_res: 'fly', on_resource_change: 'refresh' } },
    });
    const { CResRoom } = gatherLoad('room/ResRoom.ts');
    const resourceRoom = new CResRoom();
    Object.assign(resourceRoom, { index: 5, roomType: 1, nCurrentStock: 40, nOutputPerTime: 5,
        sprResourceIcon: { node: {} },
        node: { dispatchEvent: event => gatherEvents.push(event) },
        enableWorkersWork() {}, refreshCurrentStock() {},
    });
    await Promise.all([resourceRoom.startGatherRes(), resourceRoom.startGatherRes()]);
    assert.equal(gatherCalls.length, 1, 'double click cannot open parallel gather sessions');
    while (resourceRoom.nCurrentStock > 0) resourceRoom.onceGather();
    resourceRoom.onceGather();
    for (let i = 0; i < 8; ++i) await Promise.resolve();
    assert.equal(gatherCalls.length, 2);
    assert.equal(gatherCalls[0].data.phase, 'start'); assert.equal(gatherCalls[1].data.phase, 'finish');
    assert.equal(gatherCalls[0].data.gather_session_id, gatherCalls[1].data.gather_session_id);
    assert.equal(gatherCalls[0].data.room_index, 5);
    assert.equal('amount' in gatherCalls[0].data, false, 'no client resource amount is uploaded');
    assert.equal(gatherGlobal.nWood, 100, 'animation does not mutate authoritative resources');
    assert.equal(gatherEvents.filter(event => event.type === 'preview').length, 2);
    assert.equal(resourceRoom.isGathering, false);
    console.log('PASS: two independent gather phases, shared session, double-click lock, no uploaded client amounts');

    let finishCurtain, finishFade, unlockRequests = 0, unlocked = 0;
    const curtainDone = new Promise(resolve => finishCurtain = resolve);
    const fadeDone = new Promise(resolve => finishFade = resolve);
    const opacityType = class {};
    const animation = { clips: [{ name: 'unlock' }], getState: () => ({}),
        play() { this.played = true; } };
    const baseLoad = loader({
        cc: { Component: class {}, isValid: () => true, UIOpacity: opacityType,
            AnimationClip: { WrapMode: { Normal: 1 } },
            _decorator: { ccclass: () => value => value, property: () => () => {} } },
        '../GlobalData': { CGlobalData: { instance: { getRoomDataByIndex: () => ({ level: 1 }) } } },
        '../common/common': { waitUntilAnimationFinished: () => curtainDone, waitFadeInout: () => fadeDone },
        '../GameStateMgr': { gameStateMgr: { async RoomLvUpPromise() { ++unlockRequests; return [0, {}]; } } },
        '../GameConfig': { GameConfig: { ONLY_DEBUG_CLINTE: false }, SessionResult: { SUCCESS: 0 } },
        '../common/CustomEvent': { CustomEvent: class {}, UniEvent: { on_room_unlock: 'unlock' } },
        '../ConfigInterface': {}, '../ResManager': {}, '../i18nLan': {},
        '../character/character': {}, '../CharacaterMannager': {}, '../CharacatersData': {},
    });
    const curtainRoom = new (baseLoad('room/BaseRoom.ts').CBaseRoom)();
    Object.assign(curtainRoom, { bUnlockable: true, node: { dispatchEvent() {} },
        nodeLocked: { active: true, getComponent: type => type === opacityType ? { opacity: 0 } : animation,
            getChildByName: () => ({ active: true }) },
        setRoomLevel() {}, playUpgradeEffect() {}, refreshRoomData() {}, onUnlock() { ++unlocked; },
    });
    const opening = curtainRoom.onClickUnLock();
    for (let i = 0; i < 4; ++i) await Promise.resolve();
    assert.equal(animation.played, true);
    assert.equal(curtainRoom.authorityBusy, true);
    curtainRoom.refreshRoomLockShow();
    await curtainRoom.onClickUnLock();
    assert.equal(unlockRequests, 1);
    assert.equal(curtainRoom.nodeLocked.active, true, 'snapshot refresh must not hide a playing curtain');
    finishCurtain();
    for (let i = 0; i < 4; ++i) await Promise.resolve();
    assert.equal(curtainRoom.authorityBusy, true, 'fade is also part of the protected presentation');
    assert.equal(curtainRoom.nodeLocked.active, true);
    finishFade(); await opening;
    assert.equal(curtainRoom.nodeLocked.active, false);
    assert.equal(curtainRoom.authorityBusy, false); assert.equal(unlocked, 1);
    console.log('PASS: unlock curtain stays visible and locked against refresh until animation and fade complete');

    // Existing accounts initialize an unlocked barrack before its child start() runs.
    const barrackLoad = loader({
        cc: { Component: class {}, _decorator: { ccclass: () => value => value, property: () => () => {} } },
        '../GameStateMgr': { gameStateMgr: { online: true } },
        './BaseRoom': { CBaseRoom: class {} }, '../common/checkGroup': {}, '../common/CustomEvent': {},
        '../character/character': {},
        '../GlobalData': { CGlobalData: { instance: { getTroopLevel(type) {
            assert.equal(type, 1, 'unstarted checkbox group must default to soldier'); return 1;
        } } } },
        '../ResManager': { CResManager: { instance: { dynLoadMonster() {} } } },
        '../CharacatersData': { CCharactersData: { instance: { GetCharPrefabPath: () => 'soldier' } } },
    });
    const barrack = new (barrackLoad('room/BarrackRoom.ts').CBarrackRoom)();
    Object.assign(barrack, { troopBase: { removeAllChildren() {} },
        checkGroup: { index: -1, getCurCheckedIndex() { return this.index; }, setCheckBoxState(index) { this.index = index; } },
    });
    for (const name of ['lblTrainCoin', 'lblTrainMetal', 'lblTroopLv', 'lblTroopHP', 'lblTroopATK', 'lblTroopDEF']) {
        barrack[name] = { string: '' };
    }
    barrack.onUnlock();
    assert.equal(barrack.checkGroup.index, 0);
    assert.equal(barrack.nCurTroopId, 910);
    console.log('PASS: existing-account barrack initialization works before checkbox start without aborting room creation');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
