// node tests/room-configuration.cjs [path/to/typescript.js]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
let locked = false, syncCalls = 0;
const mgr = { online: true, isRoomBattleLocked: () => locked,
    async syncState() { ++syncCalls; locked = false; return { ok: true }; } };
class BaseRoom {
    onClickSetting() { this.onOpenExpand(); }
    onOpenExpand() { this.opened = true; }
}
const imports = {
    '../InvasionState': { invasionState: { locked: false } },
    '../BattleSync': { BattleSync: { instance: {} } },
    cc: { _decorator: { ccclass: () => c => c, property: () => () => {} }, isValid: n => n.valid },
    '../GameStateMgr': { gameStateMgr: mgr }, './BaseRoom': { CBaseRoom: BaseRoom },
    '../BaseDef': { eCCharacterID: { eciNone: 0 }, eRoomType: { ertCastleOutSide: 10 } },
    '../common/CustomEvent': { CustomEvent: class { constructor(type, bubbles, detail) { this.detail = detail; } },
        UniEvent: { on_pop_tips: 'tips' } },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/script/room/BattleRoom.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText, { exports: exportsObject, console, require: name => imports[name] || {} });
function room() {
    const r = new exportsObject.CBattleRoom();
    r.roomType = 10;
    r.events = [];
    r.nodeExpandPanel = { active: false };
    r.node = { valid: true, dispatchEvent: e => r.events.push(e) };
    r.endMinorInvasion = () => { r.defensePhase = 'patrol'; };
    return r;
}
async function main() {
    let r = room();
    await r.onClickSetting();
    assert.ok(r.opened, 'idle exterior opens immediately');
    assert.equal(syncCalls, 0);
    locked = true;
    r = room(); r.defensePhase = 'battle';
    await r.onClickSetting();
    assert.ok(r.opened, 'server-confirmed expiration releases the stale local lock');
    locked = true;
    mgr.syncState = async () => ({ ok: true });
    r = room();
    await r.onClickSetting();
    assert.ok(!r.opened, 'server-active battle stays locked');
    assert.equal(r.events.length, 1, 'locked click displays feedback');
    mgr.syncState = async () => { throw new Error('offline'); };
    r = room();
    await r.onClickSetting();
    assert.ok(!r.opened, 'failed synchronization cannot bypass the lock');
    assert.equal(r.checkingConfiguration, false, 'failed request allows another attempt');
    locked = false;
    r = room(); r.defensePhase = 'alert';
    await r.onClickSetting();
    assert.ok(!r.opened, 'local invasion preparation stays locked');
    console.log('PASS: exterior configuration refreshes stale locks and reports active locks');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
