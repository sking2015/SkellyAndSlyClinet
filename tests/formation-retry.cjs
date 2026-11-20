const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
let failLoad = true, failConfigure = false, creations = 0, releases = 0, deletions = 0;
const characters = {
    registerFormation() {}, unregisterFormation() {},
    async CreateChacater4room() {
        ++creations;
        if (failLoad) throw Error('resource unavailable');
        return { node: {}, setPosition() {}, setDirection2Right() {}, setInBattle() {}, IsAlive: () => true };
    },
    DeleteCharater() { ++deletions; },
};
const exp = {};
const imports = {
    cc: { isValid: () => true, UITransform: class {}, Vec3: class { constructor(x) { this.x = x; } } },
    './BaseDef': { eBattleCamp: { ebcHero: 1 } },
    './CharacaterMannager': { CCharactersManager: { instance: characters } },
    './BattleSync': { BattleSync: { instance: { bind() {}, releaseFailedBinding() { ++releases; } } } },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/script/BattleFormation.ts','utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exp, console: { error() {} }, require: n => imports[n] });
async function main() {
    const room = { index: 0, node: {}, nodeCharLayer: { getComponent: () => ({ convertToNodeSpaceAR: v => v }) },
        tfBase: { width: 670, anchorX: .5, convertToWorldSpaceAR: v => v } };
    const f = new exp.CBattleFormation(room, 1, () => -400, () => { if (failConfigure) throw Error('configuration failed'); });
    await f.setSlotCount('front', 1001, 2);
    assert.equal(f.failed, true); assert.equal(f.hasForces(), true, 'failed load is not a battlefield death');
    assert.equal(f.getCount('front'), 2);
    failLoad = false; await f.retryFailed();
    assert.equal(f.failed, false); assert.ok(f.getActive('front')); assert.equal(f.getCount('front'), 2);
    failConfigure = true;
    await f.setSlotCount('rear', 1001, 1);
    assert.equal(f.getActive('rear'), null); assert.equal(releases, 1); assert.equal(deletions, 1);
    failConfigure = false; await f.retryFailed();
    assert.equal(f.failed, false); assert.ok(f.getActive('rear'));
    const count = creations; f.dispose(); await f.retryFailed();
    assert.equal(creations, count, 'disposed scene cannot restart asynchronous spawns');
    console.log('PASS: transient formation loads retry without casualties, failed bindings release, scene disposal stops retries');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
