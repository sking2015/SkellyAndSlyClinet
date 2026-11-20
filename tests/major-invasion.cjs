const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
const defs = { eBattleCamp: { ebcHero: 1 }, eDirction: { edRight: 1 }, eCCharacterID: {} };
const state = { phase: 'idle', notoriety: 0, get locked() { return this.phase === 'battle' || this.phase === 'settling'; } };
const global = { nCurStageId: 1, nCoin: 101, nWood: 101, nMetal: 101, nCrystal: 101, nFood: 101, nSoul: 101 };
const server = { online: false };
const minor = { isIdle: true };
const sync = { bind() {}, lastSettlement: null };
class Vec3 { constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); } }
class Room {
    constructor(index, defenders = false) {
        Object.assign(this, { index, roomLevel: 1, defenders, prepared: false, locked: false,
            node: { dispatchEvent() {} }, tfBase: { width: 670, anchorX: .5, convertToWorldSpaceAR: x => x },
            nodeCharLayer: { getComponent: () => ({ convertToNodeSpaceAR: x => x }) } });
    }
    beginMajorPreparation() { this.prepared = true; }
    areDefendersReady() { return this.prepared; }
    hasDefendingForces() { return this.defenders; }
    lockMajorBattle() { this.locked = true; }
    bindBattleInstances() {}
    CloseExpand() {}
    startMinorBattle() { this.fighting = true; }
    restoreMajorDefenders() { this.restored = true; }
}
class Formation {
    constructor(room, camp, initial, configure) { this.room = room; this.configure = configure; this.slots = new Map(); }
    async setSlotCount(key, id, count) {
        if (!count) return;
        const char = { hp: 91, mp: 7, ready: false, applyInvasionLevel() {}, holdDeployment() {},
            setPosition() {}, marchToDeployment(x) { this.target = x; this.ready = false; },
            startDeploymentBattle() { this.fighting = true; }, isDeploymentReady() { return this.ready; } };
        this.slots.set(key, char); this.configure(char, false, key);
    }
    getActiveCharacters() { return [...this.slots.values()]; }
    getLineupPositions() { return new Map(this.getActiveCharacters().map((c, i) => [c, i * 60])); }
    isLoading() { return !!this.loading; }
    hasForces() { return this.slots.size > 0 || !!this.loading; }
    moveToRoom(room) { this.room = room; }
    dispose() { this.slots.clear(); }
}
const imports = { cc: { Vec3, UITransform: class {}, isValid: () => true }, './InvasionState': { invasionState: state },
    './GameStateMgr': { gameStateMgr: server }, './GlobalData': { CGlobalData: { instance: global } },
    './InvasionManager': { CInvasionManager: { instance: minor } }, './BattleSync': { BattleSync: { instance: sync } },
    './BattleFormation': { CBattleFormation: Formation }, './room/BattleRoom': { CBattleRoom: Room }, './BaseDef': defs,
    './config/TeamConfig': { TeamConfigData: { 10: { ID: 10, StageID: 1, TeamType: 'Major', Members: '1:2,1:1', DropID: 14 } } },
    './common/CustomEvent': { CustomEvent: class {}, UniEvent: {} } };
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/script/MajorInvasionManager.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, console, require: n => { if (!(n in imports)) throw Error(n); return imports[n]; } });
const Manager = exportsObject.CMajorInvasionManager;
const flush = async () => { for (let i = 0; i < 30; ++i) await Promise.resolve(); };
const stand = m => m.enemies.forEach(c => { c.ready = true; });
async function main() {
    const prefab = JSON.parse(fs.readFileSync('assets/prefab/room/CastleOutSide.prefab','utf8'));
    const frame = prefab.find(n => n.__type__ === 'cc.Node' && n._name === 'InvasionFrame');
    assert.ok(frame, 'use the existing exterior InvasionFrame');
    const hud = frame._components.map(r => prefab[r.__id__]).find(c => c.chestOpen && c.progress);
    assert.ok(hud, 'HUD component and animation references are serialized');
    assert.equal(prefab[hud.progress.__id__].__type__, 'cc.ProgressBar');
    const progress = prefab[hud.progress.__id__];
    assert.equal(progress._totalLength, 225);
    const bar = prefab[progress._barSprite.__id__];
    const barNode = prefab[bar.node.__id__];
    assert.equal(barNode._components.map(r => prefab[r.__id__]).find(c => c.__type__ === 'cc.UITransform')._anchorPoint.x, 0);
    const clip = JSON.parse(fs.readFileSync('assets/animation/chestOpen.anim','utf8'));
    assert.equal(clip[5]._values.length, 5); assert.equal(clip[0].wrapMode, 1);
    const m = new Manager(); const rooms = [new Room(0, true), new Room(1), new Room(2, true)];
    m.init(rooms); state.notoriety = 100; minor.isIdle = false; m.update(.1); await flush();
    assert.equal(m.active, false, 'wait for the current minor invasion');
    minor.isIdle = true; m.update(.1); await flush();
    assert.equal(state.phase, 'preparing'); assert.equal(state.notoriety, 0);
    assert.equal(state.locked, false, 'preparation permits room configuration');
    stand(m); assert.equal(m.ready, true); await m.startBattle(); m.update(.1);
    assert.equal(state.locked, true); assert.equal(m.phase, 'active');
    const original = m.enemies[0]; rooms[0].defenders = false; m.update(.1); stand(m); m.update(.1);
    assert.equal(m.floor, 1); assert.equal(m.enemies[0], original, 'move the same enemy instance');
    assert.equal(original.hp, 91); assert.equal(original.mp, 7);
    stand(m); m.update(.1); assert.equal(m.phase, 'leaving', 'empty floor is crossed on foot');
    stand(m); m.update(.1); stand(m); m.update(.1);
    assert.equal(m.floor, 2); assert.equal(m.phase, 'active');
    m.formation.slots.clear(); m.formation.loading = true; m.update(.1);
    assert.equal(m.phase, 'active', 'loading reserves cannot cause early victory');
    m.formation.loading = false; let victories = 0; m.onVictory = id => { assert.equal(id, 14); ++victories; };
    m.update(.1); await flush(); m.update(.1); await flush();
    assert.equal(global.nCurStageId, 2); assert.equal(victories, 1); assert.equal(state.locked, false);
    assert.ok(rooms.every(r => r.restored));
    state.notoriety = 100; m.update(.1); await flush(); assert.equal(m.active, false, 'missing stage has no fallback/reroll');
    global.nCurStageId = 1; m.init([new Room(0)]); state.notoriety = 100;
    m.update(.1); await flush(); stand(m); await m.startBattle(); m.update(.1); stand(m); m.update(.1); await flush();
    for (const key of ['nCoin','nWood','nMetal','nCrystal','nFood','nSoul']) assert.equal(global[key], 91);
    assert.equal(global.nCurStageId, 1, 'failure preserves stage');
    m.init([new Room(0)]); state.notoriety = 100;
    m.update(.1); await flush(); stand(m);
    server.online = true; server.activeBattle = { invasion_type: 'Major' };
    sync.startMajor = async () => false;
    await m.startBattle();
    assert.equal(m.phase, 'idle', 'recover an authoritative start whose original response was lost');
    assert.equal(state.locked, true, 'unknown start outcome must not unlock room operations');
    console.log('PASS: major preparation, full battle lock, empty-floor march, persistent enemy HP/MP, reserve loading, single settlement, failure penalty, missing stage');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
