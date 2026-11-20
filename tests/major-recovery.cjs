const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
let id = 0;
const requests = [], stored = new Map();
const stats = { HP: 300, MP: 20, ATK: 60, DEF: 50, INT: 20, MDF: 50, SPD: 30, LCA: 20 };
const battle = { battle_id: 'major1', invasion_type: 'Major', status: 'active', started_at: 0, last_event_seq: 0,
    events: [], enemy_slots: [{ position: 1, unit_instance_ids: ['e1','e2'] }],
    checkpoint: { room_index: 0, phase: 'active',
        units: [{ unit_instance_id: 'e1', hp: 17, mp: 0, x: 0, skill_cooldowns_ms: [1250, 0] }] },
    units: ['e1','e2'].map(unit_instance_id => ({ unit_instance_id, config_id: 1001, side: 'enemy',
        alive: true, life_no: 1, attributes: stats, hp: 17, mp: 0 })) };
const mgr = { online: true, playerId: 'player1', serverNow: 5000, activeBattle: battle,
    async operation(action, data) {
        requests.push({ action, data });
        if (action === 'battle-end') { this.activeBattle = null; return { ok: true, result: { outcome: 'win', loot: { loot_id: 'reward1', items: [], resources: { coin: 500 } } } }; }
        return { ok: true, result: {} };
    } };
const exp = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/script/BattleSync.ts','utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exp, console, localStorage: { getItem: k => stored.get(k), setItem: (k,v) => stored.set(k,v), removeItem: k => stored.delete(k) },
    require: name => name === './GameStateMgr' ? { gameStateMgr: mgr } : { newRequestId: () => `request${++id}` } });
function role() { return { eCharId: 1001, IsAlive: () => true, x: -80,
    getPosition() { return this.x; }, setPosition(x) { this.x = x; },
    skills: [1, 2].map(() => ({
        remaining: 50, restoreCooldown(ms) { this.remaining = ms; }, getRemainingCooldown() { return this.remaining; },
    })),
    setHP(v) { this._HP = v; }, setMP(v) { this._MP = v; }, setMaxHP(v) { this.maxHP = v; }, setMaxMP(v) { this.maxMP = v; } }; }
async function main() {
    const sync = exp.BattleSync.instance;
    sync.adoptMajor(battle);
    const first = role(); sync.bind(first, 'enemy', 0, 1);
    assert.equal(first._HP, 17); assert.equal(first._MP, 0, 'zero MP must survive recovery');
    assert.equal(first.maxHP, 300); assert.equal(first.ATK, 60);
    sync.restoreMajorCheckpoint();
    assert.equal(first.x, 0, 'a saved zero coordinate overrides the default lineup position');
    assert.deepEqual(first.skills.map(skill => skill.remaining), [1250, 0]);
    first._HP = 12.2;
    first.x = -37.5;
    await sync.checkpointMajor(0, 'active');
    assert.equal(requests[0].data.units[0].hp, 13, 'checkpoint serializes valid integral HP');
    assert.equal(requests[0].data.units[0].x, -37.5);
    assert.deepEqual(requests[0].data.units[0].skill_cooldowns_ms, [1250, 0]);
    sync.bind(first, 'enemy', 1, 1);
    assert.equal(sync.bindings.get(first).unit_instance_id, 'e1', 'floor transfers retain the original instance binding');
    sync.died(first); await sync.flush();
    const replacement = role(); sync.bind(replacement, 'enemy', 1, 1);
    sync.restoreMajorCheckpoint();
    assert.equal(replacement.x, -80, 'units missing from the checkpoint keep their deployment position');
    assert.equal(sync.bindings.get(replacement).unit_instance_id, 'e2');
    await sync.checkpointMajor(1, 'entering');
    const last = requests[requests.length - 1];
    assert.equal(last.data.units.length, 1, 'checkpoint excludes dead instances');
    assert.equal(last.data.units[0].unit_instance_id, 'e2');
    await sync.end(true, 'elimination');
    assert.equal(sync.lastSettlement.loot.loot_id, 'reward1');
    assert.equal(sync.snapshot, null); assert.equal(stored.size, 0);
    console.log('PASS: major HP/zero-MP restore, immutable instance binding across floors, reserve binding, death/checkpoint ordering, authoritative victory loot');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
