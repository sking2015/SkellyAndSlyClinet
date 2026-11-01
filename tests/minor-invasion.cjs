// node tests/minor-invasion.cjs <path-to-typescript/lib/typescript.js>
// 用引擎替身验证波次结算；动画、预制体绑定仍需在 Cocos 中检查。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../assets/script');
function load(file, imports = {}) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
    }).outputText;
    vm.runInNewContext(source, { exports, console: { log() {}, error() {} }, require(name) {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import: ${name}`);
    } }, { filename: file });
    return exports;
}
const defs = load('BaseDef.ts');
const { TeamConfigData } = load('config/TeamConfig.ts');
const { DropConfigData } = load('config/DropConfig.ts');
const { HerosData } = load('config/Heros.ts');
class Vec3 { constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); } }
const created = [];
let deferCreation = null;
let creationError = false;
let guardsAlive = false;
const manager = {
    async CreateChacater4room(id) {
        if (creationError) throw new Error('resource unavailable');
        const char = {
            id, node: { valid: true }, alive: true, x: 0,
            IsAlive() { return this.alive; },
            getPosition() { return this.x; },
            setPosition(x) { this.x = x; },
            setDirection2Right() {}, setInBattle() {},
        };
        created.push(char);
        if (deferCreation) await deferCreation;
        return char;
    },
    DeleteCharater(char) { char.alive = false; char.node.valid = false; },
    hasLivingEnemy() { return guardsAlive; },
};
const items = new Map([[1001, { itemNum: 30 }]]);
const cc = { isValid: node => !!node?.valid, Vec3, UITransform: class {} };
const { CInvasionManager } = load('InvasionManager.ts', {
    cc, './BaseDef': defs,
    './CharacaterMannager': { CCharactersManager: { instance: manager } },
    './common/CustomEvent': { CustomEvent: class {}, UniEvent: { on_resource_change: 'resource' } },
    './config/TeamConfig': { TeamConfigData }, './config/DropConfig': { DropConfigData }, './config/Heros': { HerosData },
    './GlobalData': { CGlobalData: { instance: { mgrItem: {
        getItem: id => items.get(id), createItem: (id, count) => items.set(id, { itemNum: count }),
    } } } },
});
function room(type = defs.eRoomType.ertCastleOutSide) {
    return {
        roomType: type, roomLevel: 1,
        node: { valid: true, activeInHierarchy: true, dispatchEvent() {} },
        tfBase: { width: 670, anchorX: 0.5, convertToWorldSpaceAR: p => p },
        nodeCharLayer: { getComponent: () => ({ convertToNodeSpaceAR: p => p }) },
    };
}
async function flush() { for (let n = 0; n < 12; n++) await Promise.resolve(); }
async function spawn(invasion) { invasion.update(41); await flush(); assert.equal(invasion.state, 'active'); }
async function main() {
    const invasion = new CInvasionManager();
    invasion.init([room(defs.eRoomType.ertDoor), room()]);
    assert.ok(invasion.remaining >= 20 && invasion.remaining <= 40);
    invasion.update(19);
    assert.equal(created.length, 0);
    await spawn(invasion);
    assert.deepEqual(created.map(char => char.id), [1001, 1001, 1002]);
    assert.ok(created.every(char => char.x < -335));
    const countdown = invasion.remaining;
    invasion.update(1000);
    assert.equal(invasion.remaining, countdown, 'active waves do not count down');
    assert.equal(created.length, 3, 'no overlapping waves');
    created.forEach(char => char.x = invasion.exitX);
    invasion.update(0.1);
    assert.equal(invasion.state, 'waiting');
    assert.equal(items.get(1001).itemNum, 30, 'pass-through gives no reward');
    assert.ok(created.every(char => !char.node.valid), 'escaped enemies cleaned up');

    await spawn(invasion);
    invasion.enemies.forEach(char => char.alive = false);
    invasion.update(0.1);
    assert.equal(items.get(1001).itemNum, 31, 'full elimination gives configured reward');
    invasion.update(0.1);
    assert.equal(items.get(1001).itemNum, 31, 'reward granted once');

    await spawn(invasion);
    invasion.enemies[0].x = invasion.exitX;
    invasion.update(0.1);
    invasion.enemies.forEach(char => char.alive = false);
    invasion.update(0.1);
    assert.equal(items.get(1001).itemNum, 31, 'partial elimination gives no reward');

    creationError = true;
    invasion.update(41);
    await flush();
    assert.equal(invasion.state, 'waiting', 'load failure retries next interval');
    assert.equal(items.get(1001).itemNum, 31);
    creationError = false;

    let release;
    deferCreation = new Promise(resolve => release = resolve);
    invasion.update(41);
    const pending = created[created.length - 1];
    invasion.stop();
    release();
    await flush();
    deferCreation = null;
    assert.equal(pending.node.valid, false, 'late async results cleaned after stop');
    assert.equal(invasion.room, null);
    assert.equal(invasion.state, 'waiting');

    const disabled = room();
    invasion.init([disabled]);
    disabled.node.activeInHierarchy = false;
    const remaining = invasion.remaining;
    invasion.update(1000);
    assert.equal(invasion.remaining, remaining, 'inactive rooms pause countdown');

    // 执行真实战斗角色方法，检查无守军的离场及交战恢复。
    const decorators = { ccclass: () => target => target, property: () => () => {} };
    const dummy = new Proxy({}, { get: () => class {} });
    const imports = new Proxy({
        cc: { ...cc, _decorator: decorators }, '../BaseDef': defs,
        './overseer': { COverseer: class {} },
        '../CharacaterMannager': { CCharactersManager: { instance: manager } },
    }, { has: () => true, get: (target, key) => target[key] || dummy });
    const { CBattleRole } = load('character/battlerole.ts', imports);
    const role = new CBattleRole();
    role.IsAlive = () => true;
    role.getPosition = () => role.x || 0;
    role.setPosition = x => role.x = x;
    role.setDirection2Right = () => {};
    role.playRun = () => {};
    role.runSpeed = 100;
    role.bInBattle = true;
    role.invasionExitX = 435;
    role.BattleAITick();
    role.UpdateMove(1);
    assert.equal(role.x, 100, 'unguarded invaders advance');
    role.UpdateMove(10);
    assert.equal(role.x, 435, 'movement clamps to exit');
    guardsAlive = true;
    let selected = false;
    role.onSelectSkill = () => selected = true;
    role.onSelectTarget = () => {};
    role.BattleAITick();
    assert.ok(selected, 'living defenders restore existing combat AI');
    guardsAlive = false;
    role.IsAlive = () => false;
    role.x = 0;
    role.UpdateMove(1);
    assert.equal(role.x, 0, 'dead invaders do not move');
    console.log('PASS: Minor invasion timing, composition, traversal, combat handoff, rewards, cancellation and cleanup');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
