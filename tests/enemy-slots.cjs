// node tests/enemy-slots.cjs [path/to/typescript.js]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
function load(file, imports, globals = {}) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(`assets/script/${file}.ts`, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(code, { exports, console, ...globals, require(name) {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import ${name}`);
    } });
    return exports;
}
async function main() {
    const slots = [1, 2].map(position => ({ position, hero_id: 1, count: 2,
        unit_instance_ids: [`${position}a`, `${position}b`] }));
    const battle = { status: 'active', enemy_slots: slots,
        units: slots.flatMap(slot => slot.unit_instance_ids.map(id => ({
            unit_instance_id: id, config_id: 1001, side: 'enemy', alive: true, life_no: 1,
        }))) };
    const mgr = { online: true };
    const { BattleSync } = load('BattleSync', {
        './GameStateMgr': { gameStateMgr: mgr }, './Protocol': {},
    });
    const sync = BattleSync.instance;
    sync.battle = battle;
    const first = { eCharId: 1001 }, second = { eCharId: 1001 }, replacement = { eCharId: 1001 };
    sync.bind(first, 'enemy', 0, 1);
    sync.bind(second, 'enemy', 0, 2);
    assert.equal(sync.bindings.get(first).unit_instance_id, '1a');
    assert.equal(sync.bindings.get(second).unit_instance_id, '2a', 'second slot must not consume first slot reserve');
    sync.bind(replacement, 'enemy', 0, 2);
    assert.equal(sync.bindings.get(replacement).unit_instance_id, '2b');
    assert.throws(() => sync.bind({ eCharId: 1001 }, 'enemy', 0, 3), /No server enemy slot/);

    const created = [];
    class Formation {
        constructor(room, camp, initialX, configure) { this.configure = configure; }
        async setSlotCount(key, id, count) {
            const char = { holdDeployment() {}, marchToDeployment() {} };
            created.push({ key, id, count, char });
            this.configure(char, false, key);
        }
        getActiveCharacters() { return created.map(entry => entry.char); }
        getLineupPositions() { return new Map(this.getActiveCharacters().map((char, i) => [char, i * 100])); }
    }
    class Vec3 { constructor(x = 0) { this.x = x; } }
    let resolveStart;
    const server = { snapshot: battle, start: () => new Promise(resolve => { resolveStart = resolve; }) };
    const { CInvasionManager } = load('InvasionManager', {
        './GameStateMgr': { gameStateMgr: mgr }, './BattleSync': { BattleSync: { instance: server } },
        cc: { Vec3, UITransform: class {}, isValid: node => !!node },
        './BaseDef': { eBattleCamp: { ebcHero: 1 }, eCCharacterID: { eciHerosStart: 1000 }, eDirction: { edRight: 1 } },
        './common/CustomEvent': {}, './config/Heros': { HerosData: { 1: {} } },
        './config/TeamConfig': { TeamConfigData: { 1: { TeamType: 'Minor' } } },
        './BattleFormation': { CBattleFormation: Formation },
    });
    const invasion = new CInvasionManager();
    let alerts = 0;
    invasion.room = { index: 0, bindBattleInstances() {}, beginMinorInvasion() { ++alerts; },
        tfBase: { width: 670, anchorX: 0.5, convertToWorldSpaceAR: p => p },
        nodeCharLayer: { getComponent: () => ({ convertToNodeSpaceAR: p => p }) },
    };
    const rejected = invasion.prepare();
    assert.equal(invasion.state, 'checking');
    assert.equal(alerts, 0, 'pending server confirmation must not trigger an alert');
    resolveStart(false);
    await rejected;
    assert.equal(invasion.state, 'waiting');
    assert.equal(alerts, 0, 'no encounter must not trigger an alert');
    const accepted = invasion.prepare();
    resolveStart(true);
    await accepted;
    assert.equal(invasion.state, 'preparing');
    assert.equal(alerts, 1, 'alert only after server confirms battle');
    await invasion.spawn();
    assert.equal(invasion.state, 'entering');
    assert.deepEqual(created.map(({ key, id, count }) => ({ key, id, count })), [
        { key: 1, id: 1001, count: 2 }, { key: 2, id: 1001, count: 2 },
    ], 'four server instances create two positions, each with one reserve');
    server.end = async () => { throw new Error('settlement transport exception'); };
    await invasion.finishOnline();
    assert.equal(invasion.state, 'active', 'settlement exceptions must leave finishing and allow retry');
    assert.equal(invasion.finishRetry, 3);
    let disposed = false, ended = false;
    invasion.formation.dispose = () => { disposed = true; };
    Object.assign(invasion.room, { roomLevel: 1, node: { activeInHierarchy: true },
        endMinorInvasion() { ended = true; } });
    mgr.activeBattle = null;
    invasion.update(0.1);
    assert.equal(invasion.state, 'waiting', 'closed authoritative battle clears local battle phase');
    assert.ok(disposed && ended, 'clear enemy formation and release room configuration lock');
    console.log('PASS: online enemy slots preserve deployment counts and bind reserves to their own slot');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
