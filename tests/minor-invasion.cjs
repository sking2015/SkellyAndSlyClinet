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
    registerFormation() {}, unregisterFormation() {},
    getBlockedPosition: (src, x) => x,
    getFirstEnemyOnPath: () => null,
    async CreateChacater4room(id) {
        if (creationError) throw new Error('resource unavailable');
        const char = {
            id, eCharId: id, node: { valid: true }, alive: true, x: 0,
            IsAlive() { return this.alive; },
            getPosition() { return this.x; },
            setPosition(x) { this.x = x; },
            setDirection2Right() {}, setDirection2Left() {}, setInBattle() {}, playEffect() {},
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
const { CBattleFormation } = load('BattleFormation.ts', {
    cc, './BaseDef': defs, './CharacaterMannager': { CCharactersManager: { instance: manager } },
});
const { CInvasionManager } = load('InvasionManager.ts', {
    cc, './BaseDef': defs,
    './BattleFormation': { CBattleFormation },
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
function kill(char) { char.alive = false; char.onBattleDeath?.(char); }
async function main() {
    const invasion = new CInvasionManager();
    invasion.init([room(defs.eRoomType.ertDoor), room()]);
    assert.ok(invasion.remaining >= 20 && invasion.remaining <= 40);
    invasion.update(19);
    assert.equal(created.length, 0);
    await spawn(invasion);
    assert.deepEqual(created.map(char => char.id), [1001, 1002]);
    assert.equal(invasion.formation.getCount(1001), 2, 'duplicate heroes are stored as reserves');
    assert.ok(created.every(char => char.x < -335));
    const countdown = invasion.remaining;
    invasion.update(1000);
    assert.equal(invasion.remaining, countdown, 'active waves do not count down');
    assert.equal(created.length, 2, 'no overlapping waves');
    created.forEach(char => char.x = invasion.exitX);
    invasion.update(0.1);
    assert.equal(invasion.state, 'waiting');
    assert.equal(items.get(1001).itemNum, 30, 'pass-through gives no reward');
    assert.ok(created.every(char => !char.node.valid), 'escaped enemies cleaned up');

    await spawn(invasion);
    invasion.enemies.forEach(kill);
    invasion.update(0.1);
    assert.equal(invasion.state, 'active', 'pending reserves prevent early victory');
    assert.equal(items.get(1001).itemNum, 30);
    await flush();
    assert.equal(invasion.enemies.length, 1, 'one hero1 reserve replaces the fallen hero1');
    assert.ok(invasion.enemies[0].x < -335, 'enemy reserve enters from left');
    assert.equal(invasion.enemies[0].reinforcementTargetX, 0);
    invasion.enemies.forEach(kill);
    invasion.update(0.1);
    assert.equal(items.get(1001).itemNum, 31, 'full elimination gives configured reward');
    invasion.update(0.1);
    assert.equal(items.get(1001).itemNum, 31, 'reward granted once');

    await spawn(invasion);
    invasion.enemies[0].x = invasion.exitX;
    invasion.update(0.1);
    invasion.enemies.forEach(kill);
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
    const skillBase = load('skills/skillbase.ts', {
        '../BaseDef': defs, '../CharacaterMannager': { CCharactersManager: { instance: manager } },
    });
    const skillImports = { './skillbase': skillBase, '../BaseDef': defs };
    const once = load('skills/skillonce.ts', skillImports);
    const launch = load('skills/skillLanche.ts', skillImports);
    const cure = load('skills/skillcure.ts', skillImports);
    const imports = new Proxy({
        cc: { ...cc, _decorator: decorators }, '../BaseDef': defs,
        './overseer': { COverseer: class {} },
        '../CharacaterMannager': { CCharactersManager: { instance: manager } },
        '../skills/skillonce': once, '../skills/skillLanche': launch, '../skills/skillcure': cure,
    }, { has: () => true, get: (target, key) => target[key] || dummy });
    const { CBattleRole } = load('character/battlerole.ts', imports);
    const defenderRoom = room();
    const losses = [];
    const defenders = new CBattleFormation(defenderRoom, defs.eBattleCamp.ebcDemon, () => 70,
        (char, replacement) => { if (replacement) char.reinforcementTargetX = 70; },
        (id, count) => losses.push([id, count]));
    await defenders.setCount(910, 2);
    const firstSkeleton = defenders.getActive(910);
    assert.equal(defenders.getActiveCharacters().length, 1);
    assert.equal(defenders.getCount(910), 2);
    await defenders.setCount(910, 3);
    assert.equal(defenders.getActive(910), firstSkeleton, 'editing reserves preserves the active unit');
    kill(firstSkeleton);
    assert.ok(defenders.hasForces(), 'loading friendly reserve still counts as defending forces');
    assert.equal(defenders.getCount(910), 2);
    await flush();
    const secondSkeleton = defenders.getActive(910);
    assert.notEqual(secondSkeleton, firstSkeleton);
    assert.ok(secondSkeleton.x > 335, 'friendly reserve enters from right');
    assert.equal(secondSkeleton.reinforcementTargetX, 70);
    assert.equal(defenders.getActiveCharacters().length, 1, 'only one same-type friendly remains alive');
    kill(secondSkeleton);
    await flush();
    kill(defenders.getActive(910));
    assert.equal(defenders.hasForces(), false);
    assert.deepEqual(losses, [[910, 2], [910, 1], [910, 0]], 'casualties consume exactly one unit each');
    defenders.dispose();

    const roomData = { nSoldierNum: 2, nArcherNum: 0, nMageNum: 0, eGuardId: 0 };
    const battleRoomImports = new Proxy({
        cc: { ...cc, _decorator: decorators }, './BaseRoom': { CBaseRoom: class {} },
        '../BaseDef': defs, '../BattleFormation': { CBattleFormation },
        '../character/battlerole': { CBattleRole },
        '../GlobalData': { CGlobalData: { instance: {
            getRoomDataByIndex: () => roomData, getRoomGuardIdByIndex: () => roomData.eGuardId,
            getRoomSoldierNumByIndex: () => roomData.nSoldierNum,
            getRoomArcherNumByIndex: () => roomData.nArcherNum,
            getRoomMageNumByIndex: () => roomData.nMageNum,
        } } },
    }, { has: () => true, get: (target, key) => target[key] || dummy });
    const { CBattleRoom } = load('room/BattleRoom.ts', battleRoomImports);
    const deployedRoom = Object.assign(new CBattleRoom(), room());
    const ui = { setCount() {}, setHealth() {}, setCharID() {} };
    Object.assign(deployedRoom, { lordInfo: ui, troopInfoSoldier: ui, troopInfoArcher: ui,
        troopInfoMage: ui, lblTotalTroops: { string: '' }, nSoldierNum: 2 });
    await deployedRoom.refreshSoldierRole();
    kill(deployedRoom.charSoldier);
    await flush();
    assert.equal(roomData.nSoldierNum, 1, 'friendly casualties persist to room data');
    assert.equal(deployedRoom.nSoldierNum, 1);
    const survivor = deployedRoom.charSoldier;
    deployedRoom.refreshExpand();
    await flush();
    assert.equal(deployedRoom.charSoldier, survivor, 'opening room panel does not reset the survivor');
    kill(survivor);
    assert.equal(roomData.nSoldierNum, 0);
    assert.equal(deployedRoom.charSoldier, null);
    assert.equal(deployedRoom.lblTotalTroops.string, '0/15');
    deployedRoom.onDestroy();

    let unlockReserve;
    const cancelledFormation = new CBattleFormation(room(), defs.eBattleCamp.ebcDemon, () => 70, () => {});
    await cancelledFormation.setCount(910, 2);
    deferCreation = new Promise(resolve => unlockReserve = resolve);
    kill(cancelledFormation.getActive(910));
    const lateReserve = created[created.length - 1];
    cancelledFormation.dispose();
    unlockReserve();
    await flush();
    deferCreation = null;
    assert.equal(lateReserve.node.valid, false, 'pending reserves cannot reappear after formation disposal');

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

    // 战场与父节点经过缩放、位移后，仍按角色身体范围判断，兼容左右翻转。
    guardsAlive = true;
    role.IsAlive = () => true;
    const coordinates = {
        convertToWorldSpaceAR: p => new Vec3(p.x * 2 + 100, p.y, p.z),
        convertToNodeSpaceAR: p => new Vec3((p.x - 100) / 2, p.y, p.z),
    };
    role.room = { tfBase: { width: 670, anchorX: 0.5, ...coordinates } };
    let facingScale = 1;
    const body = { width: 40, anchorX: 0.5,
        convertToWorldSpaceAR: p => coordinates.convertToWorldSpaceAR(new Vec3(role.x + p.x * facingScale, p.y, p.z)),
    };
    role.node = { getComponent: () => body, parent: { getComponent: () => coordinates },
        get worldPosition() { return coordinates.convertToWorldSpaceAR(new Vec3(role.x)); },
    };
    role.x = -500;
    selected = false;
    role.BattleAITick();
    assert.equal(selected, false, 'offscreen roles cannot start selecting or casting skills');
    role.UpdateMove(10);
    assert.equal(role.x, -315, 'offscreen role enters even when already within skill range or without a target');
    assert.equal(role.getBattlefieldEntryX(), null, 'whole body inside left boundary');
    role.x = -320;
    assert.equal(role.getBattlefieldEntryX(), -315, 'partial entry still blocks casting');
    facingScale = -1;
    role.x = 500;
    assert.equal(role.getBattlefieldEntryX(), 315, 'mirrored role enters from right boundary');
    role.UpdateMove(10);
    assert.equal(role.x, 315);
    selected = false;
    role.BattleAITick();
    assert.ok(selected, 'combat resumes once inside');
    let casts = 0;
    role.curSkill = { IsCoolDown: () => true, doCast: () => casts++, bIsUltimate: false, nSkillRange: 99999 };
    role.x = -500;
    await role.CastSkill();
    assert.equal(casts, 0, 'direct cast entry also blocks skills outside regardless of range');
    role.x = 0;
    await role.CastSkill();
    assert.equal(casts, 1, 'skills cast normally inside');
    role.reinforcementTargetX = 70;
    role.x = 435;
    await role.CastSkill();
    assert.equal(casts, 1, 'reserves cannot cast before reaching their replacement position');
    role.UpdateMove(10);
    assert.equal(role.x, 70, 'reserve movement clamps to assigned battlefield position');
    assert.equal(role.reinforcementTargetX, null);
    await role.CastSkill();
    assert.equal(casts, 2, 'reserve starts fighting after arriving');

    const humanMage = new CBattleRole();
    humanMage.eCharId = defs.eCCharacterID.eciMageHF;
    humanMage.getBattleCamp = () => defs.eBattleCamp.ebcHero;
    humanMage.loadData();
    assert.equal(humanMage.skills.find(s => s instanceof launch.CSkillLanche).eMissile, defs.eMissileId.emiFireball);
    const skullMage = new CBattleRole();
    skullMage.eCharId = defs.eCCharacterID.eciSkullMage;
    skullMage.getBattleCamp = () => defs.eBattleCamp.ebcDemon;
    skullMage.loadData();
    assert.equal(skullMage.skills.length, 1, 'skull mage does not inherit tauren skill');
    assert.equal(skullMage.getHP(), 5000, 'skull mage does not inherit tauren HP');
    assert.equal(skullMage.skills[0].eMissile, defs.eMissileId.emiDarkMagic);
    humanMage.onSelectSkill();
    const fireballSkill = humanMage.curSkill;
    fireballSkill.nLastCastTime = Date.now();
    humanMage.onSelectSkill();
    assert.equal(humanMage.curSkill, fireballSkill, 'ranged cooldown does not switch mage to melee pursuit');
    humanMage.eState = 3; // ebsSkill
    fireballSkill.nLastCastTime = 0;
    const locked = humanMage.curSkill;
    humanMage.onSelectSkill();
    assert.equal(humanMage.curSkill, locked, 'animation skill cannot change mid-cast');

    const rangedTarget = { IsAlive: () => true, getInBattle: () => true };
    manager.FindNearestChar = () => rangedTarget;
    let distance = 300;
    humanMage.getDistance = () => distance;
    humanMage.playStand = () => {};
    humanMage.playRun = () => {};
    humanMage.onRunToTarget = () => {};
    humanMage.getPosition = () => humanMage.x || 0;
    humanMage.setPosition = x => humanMage.x = x;
    humanMage.eState = 2; // ebsRun
    fireballSkill.nLastCastTime = Date.now();
    humanMage.BattleAITick();
    assert.equal(humanMage.eState, 1, 'mage stands in fireball range while cooling down');
    humanMage.handleMove(1);
    assert.equal(humanMage.getPosition(), 0, 'mage does not advance toward in-range target');
    distance = 500;
    humanMage.BattleAITick();
    assert.equal(humanMage.eState, 1, 'exactly 500 pixels is within fireball range');
    distance = 600;
    humanMage.BattleAITick();
    assert.equal(humanMage.eState, 2, 'mage approaches targets outside fireball range');
    distance = 300;
    humanMage.BattleAITick();
    assert.equal(humanMage.eState, 1, 'mage stops as soon as target enters range during cooldown');
    let rangedCasts = 0;
    humanMage.CastSkill = () => rangedCasts++;
    fireballSkill.nLastCastTime = 0;
    humanMage.BattleAITick();
    assert.equal(rangedCasts, 1, 'mage fires after cooldown without approaching further');

    let emitted = [];
    const originalTarget = { getPosition: () => 100, IsAlive: () => true, getInBattle: () => true };
    const shooter = { getPosition: () => 0, playCastEffect() {}, play() {},
        LauncheMissile: (id, target) => emitted.push({ id, target }),
    };
    const shot = new launch.CSkillLanche(shooter);
    shot.LoadData();
    shot.target = originalTarget;
    shot.doCast();
    shot.target = {};
    shot.LauncheMissile();
    shot.LauncheMissile();
    assert.equal(emitted.length, 1, 'keyframe and completion emit only one missile');
    assert.equal(emitted[0].target, originalTarget, 'missile retains cast target');

    const readAsset = relative => JSON.parse(fs.readFileSync(path.resolve(root, '../..', relative), 'utf8'));
    const animationIds = {};
    for (const effect of ['fireball', 'darkmagic']) {
        const allowedFrames = new Set();
        const textureRoot = path.resolve(root, `../texture/frame/effect/${effect}`);
        function collect(dir) {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, entry.name);
                if (entry.isDirectory()) collect(p);
                else if (p.endsWith('.png.meta')) allowedFrames.add(JSON.parse(fs.readFileSync(p, 'utf8')).uuid + '@f9941');
            }
        }
        collect(textureRoot);
        animationIds[effect] = [];
        for (const clip of ['fly', 'explode']) {
            const file = `assets/animation/effect/${effect}/${clip}.anim`;
            animationIds[effect].push(readAsset(file + '.meta').uuid);
            for (const track of readAsset(file).filter(o => o.__type__ === 'cc.ObjectCurve')) {
                assert.equal(track._times.length, track._values.length);
                assert.ok(track._values.every(frame => allowedFrames.has(frame.__uuid__)), `${effect} animation uses only its own frames`);
            }
        }
        const prefab = JSON.stringify(readAsset(`assets/prefab/missile/${effect}.prefab`));
        for (const id of animationIds[effect]) assert.ok(prefab.includes(id));
    }
    assert.ok(animationIds.fireball.every(id => !animationIds.darkmagic.includes(id)), 'effect animations are independent');
    const scene = readAsset('assets/scene/Main.scene');
    for (const entry of scene.filter(o => o.__type__ === 'CMissileId2Prefab')) {
        const effect = { 1: 'fireball', 4: 'darkmagic' }[entry.emId];
        if (effect) assert.equal(entry.pfbMissile.__uuid__, readAsset(`assets/prefab/missile/${effect}.prefab.meta`).uuid);
    }

    const { CMissile } = load('skills/missile.ts', { cc: { ...cc, Component: class {}, _decorator: decorators },
        '../character/battlerole': { CBattleRole },
        '../CharacaterMannager': { CCharactersManager: { instance: manager } },
    });
    const missile = new CMissile();
    let hits = 0, finished = 0, destroyed = 0;
    const battleRoom = {};
    missile.caster = { valid: true, getRoom: () => battleRoom, getBattleCamp: () => 1, onMissileFinished: () => finished++ };
    missile._isMoving = true;
    missile.hitTarget(null);
    const victim = { getRoom: () => battleRoom, getBattleCamp: () => 2, IsAlive: () => true,
        getInBattle: () => true, onHitedReady() {}, onHited: () => hits++,
    };
    missile.hitTarget(victim);
    missile.hitTarget(victim);
    missile.onFinished();
    assert.equal(hits, 1, 'duplicate contacts do not duplicate damage');
    assert.equal(finished, 1, 'missile completion notified once');
    missile.node = { destroy: () => destroyed++ };
    missile.update(0.1);
    assert.equal(destroyed, 1, 'finished missile is destroyed');

    const { CCharactersManager: ActualManager } = load('CharacaterMannager.ts', {
        cc, './BaseDef': defs, './character/character': { CCharacter: class {} }, './ResManager': {},
    });
    const actualManager = new ActualManager();
    const identity = { convertToNodeSpaceAR: p => p, convertToWorldSpaceAR: p => p };
    const lineRoom = { index: 99, nodeCharLayer: { getComponent: () => identity } };
    function fighter(x, camp, half = 10) {
        return { alive: true, node: { valid: true, activeInHierarchy: true }, getRoom: () => lineRoom,
            getPosition: () => x, getRoleHalfWidth: () => half, getBattleCamp: () => camp,
            IsAlive() { return this.alive; }, getInBattle: () => true,
            onHitedReady() {}, hits: 0, onHited() { this.hits++; },
        };
    }
    const incoming = fighter(-300, 2);
    const front = fighter(0, 1);
    const rear = fighter(100, 1, 300);
    actualManager.mapCharInRoom.set(99, { getAllChars: () => [rear, incoming, front] });
    assert.equal(actualManager.FindNearestChar(incoming, 1), front, 'large rear unit cannot steal frontline aggro');
    assert.equal(actualManager.getBlockedPosition(incoming, 400), -22, 'large movement step stops before frontline');
    assert.equal(actualManager.getFirstEnemyOnPath(incoming, -300, 400), front, 'projectile hits frontline first');
    assert.equal(actualManager.getFirstEnemyOnPath(incoming, -300, -180), null, 'oversized rear unit cannot bypass frontline shielding');
    manager.getBlockedPosition = (src, x) => actualManager.getBlockedPosition(src, x);
    manager.getFirstEnemyOnPath = (src, start, end) => actualManager.getFirstEnemyOnPath(src, start, end);
    role.room = lineRoom;
    role.getRoom = () => lineRoom;
    role.getBattleCamp = () => 2;
    role.getRoleHalfWidth = () => 10;
    role.x = -300;
    role.reinforcementTargetX = 100;
    role.UpdateMove(10);
    assert.equal(role.x, -22, 'reinforcement stops at the first opponent rather than crossing to its assigned position');
    assert.equal(role.reinforcementTargetX, null, 'contact releases forced reinforcement movement');
    const shotThrough = new CMissile();
    shotThrough.caster = incoming;
    shotThrough._direction = { x: 1, y: 0.8 };
    shotThrough._isMoving = true;
    shotThrough.node = { position: new Vec3(-300, 100), parent: { getComponent: () => identity },
        setPosition(x, y, z) { this.position = new Vec3(x, y, z); } };
    shotThrough.update(1);
    assert.equal(front.hits, 1, 'swept projectile hits front despite high trajectory and large timestep');
    assert.equal(rear.hits, 0);
    assert.equal(shotThrough.node.position.x, -10, 'projectile stops at frontline contact');
    front.alive = false;
    assert.equal(actualManager.FindNearestChar(incoming, 1), rear, 'rear becomes target after frontline dies');
    assert.equal(actualManager.getFirstEnemyOnPath(incoming, -300, 400), rear);
    const rightIncoming = fighter(300, 1);
    const heroFront = fighter(0, 2);
    const heroRear = fighter(-100, 2, 300);
    actualManager.mapCharInRoom.set(99, { getAllChars: () => [heroRear, heroFront, rightIncoming] });
    assert.equal(actualManager.FindNearestChar(rightIncoming, 2), heroFront);
    assert.equal(actualManager.getBlockedPosition(rightIncoming, -400), 22, 'blocking works from the right as well');
    assert.equal(actualManager.getFirstEnemyOnPath(rightIncoming, 300, -400), heroFront);
    console.log('PASS: Minor invasion timing, composition, traversal, combat handoff, rewards, cancellation and cleanup');
    console.log('PASS: Battlefield entry gates skills and moves offscreen roles inside from either side');
    console.log('PASS: Hero/skull mage loadouts, skill locking, missile targeting, animation isolation and missile lifecycle');
    console.log('PASS: One active character per type, reserves on both sides, casualty counts and cancellation');
    console.log('PASS: Frontline targeting, reinforcement blocking and non-piercing projectile sweeps in both directions');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
