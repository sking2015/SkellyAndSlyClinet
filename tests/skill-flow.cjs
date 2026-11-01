// Run: node tests/skill-flow.cjs [path/to/typescript.js]
// Cocos rendering is stubbed; the role, configs, factory, skills and targeting are real.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../assets/script');
const cache = new Map();
const room = { index: 1 };
class Character {
    constructor() {
        this.node = { activeInHierarchy: true };
        this.bIsAlive = true;
        this.room = room;
        this.x = 0;
        this.nHalfWidth = 10;
        this.nCamp = 1;
        this.moveDirection = 1;
    }
    getRoom() { return this.room; }
    getPosition() { return this.x; }
    getRoleHalfWidth() { return this.nHalfWidth; }
    getDistance(target) { return Math.abs(this.x - target.x) - this.nHalfWidth - target.nHalfWidth; }
    getBattleCamp() { return this.nCamp; }
    IsToDirRight() { return this.moveDirection > 0; }
    IsAlive() { return this.bIsAlive; }
    play() {}
    playStand() {}
    onHitedReady() {}
    onHited() { this.hits = (this.hits || 0) + 1; }
    onBeforeCastSkill() {}
    onAfterCastSkill() {}
    onCastSkillToTarget() {}
}
const cc = {
    Component: class {},
    Vec3: class { constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); } },
    _decorator: { ccclass: () => value => value, property: () => () => {} },
    Animation: { EventType: { FINISHED: 'finished' } },
    isValid: value => !!value,
};
function load(relative) {
    const file = path.resolve(root, relative.endsWith('.ts') ? relative : `${relative}.ts`);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
    }).outputText;
    const localRequire = name => {
        if (name === 'cc') return cc;
        const target = path.resolve(path.dirname(file), `${name}.ts`);
        if (target === path.join(root, 'character/character.ts')) return { CCharacter: Character };
        if (target === path.join(root, 'character/overseer.ts')) return { COverseer: Character };
        if (/\/(common\/common|common\/CustomEvent|ResManager|BattleFormation|PopInfo|StatuBar)\.ts$/.test(target.replaceAll('\\', '/'))) return {};
        return load(path.relative(root, target));
    };
    vm.runInThisContext(`(function(require, module, exports) {${code}\n})`, { filename: file })(localRequire, module, module.exports);
    return module.exports;
}
const { CBattleRole } = load('character/battlerole');
const { CCharactersManager } = load('CharacaterMannager');
const { CSkillFactory } = load('skills/gskillFactroy');
const { HerosData } = load('config/Heros');
const { MonstersData } = load('config/Monsters');
const { SkillsCfgData } = load('config/SkillsCfg');
const manager = CCharactersManager.instance;
let actors = [];
manager.getRoomCharacters = () => actors;
manager.mapCharInRoom.set(1, { getAllChars: () => actors });
function role(id) {
    const result = new CBattleRole();
    result.eCharId = id;
    result.loadData();
    result.setInBattle(true);
    return result;
}

for (const [table, offset] of [[MonstersData, 0], [HerosData, 1000]]) {
    for (const cfg of Object.values(table)) {
        const actor = role(cfg.ID + offset);
        assert.equal(actor.getHP(), cfg.HP);
        assert.equal(actor.getMP(), cfg.MP);
        assert.equal(actor.ATK, cfg.ATK);
        const ids = [cfg.Skill1, cfg.Skill2, cfg.Skill3].filter(id => id !== 'undefined').map(Number);
        assert.deepEqual(actor.skills.map(skill => skill.config.ID), ids);
        for (const skill of actor.skills) {
            assert.equal(skill.nCD, skill.config.CoolDown * 1000);
            assert.equal(skill.nSkillRange, skill.config.SkillRange);
            assert.equal(skill.nTargetsLimit, skill.config.TargetsLimit);
            assert.equal(skill.caster, actor);
        }
        actor.loadData();
        assert.equal(actor.skills.length, ids.length);
    }
}
const dragon = role(4), enemy = role(1001);
dragon.x = 0; enemy.x = 25;
actors = [dragon, enemy];
dragon.onSelectSkill(); dragon.onSelectTarget();
assert.equal(dragon.curSkill.config.ID, 9999);
assert.deepEqual(dragon.arrTargets, [enemy]);
dragon.curSkill.nLastCastTime = Date.now();
dragon.onSelectSkill();
assert.equal(dragon.curSkill.config.ID, 1001, 'basic attack remains available during ultimate cooldown');
const mage = role(1002);
mage.x = 0; enemy.x = 200; enemy.nCamp = 1;
actors = [mage, enemy];
mage.skills.push(CSkillFactory.CreateSkill(mage, 1001));
mage.skills[0].nLastCastTime = Date.now();
mage.onSelectSkill();
assert.equal(mage.curSkill.config.ID, 1003, 'ranged caster holds position while cooling down');
for (const id of [1003, 1004, 1005, 1006]) {
    assert.equal(CSkillFactory.CreateSkill(mage, id).eMissile, SkillsCfgData[id].AddData);
}
assert.throws(() => CSkillFactory.CreateSkill(mage, -1), /Unknown skill ID/);
const previous = mage.skills;
HerosData[2] = { ...HerosData[2], Skill3: 'invalid' };
assert.throws(() => mage.loadData(), /Invalid skill ID/);
assert.equal(mage.skills, previous);
HerosData[2] = { ...HerosData[2], Skill3: '1005' };
mage.loadData();
assert.deepEqual(mage.skills.map(skill => skill.config.ID), [1003, 1005]);

const once = CSkillFactory.CreateSkill(dragon, 1001);
enemy.onHited = Character.prototype.onHited;
enemy.nCamp = 2; enemy.x = 25;
once.target = enemy;
let animationEnd;
dragon.play = (name, cb) => { animationEnd = cb; };
once.doCast();
once.OnAnimationHit(); once.OnAnimationHit(); animationEnd();
assert.equal(enemy.hits, 1, 'animation event and completion must not deal duplicate damage');
actors = [dragon, enemy];
const rangeCfg = { ...SkillsCfgData[1001], ID: 8000, SkillClass: 3, TargetsLimit: 1 };
SkillsCfgData[8000] = rangeCfg;
const range = CSkillFactory.CreateSkill(dragon, 8000);
range.onConfirmTargets();
assert.deepEqual(range.arrTargets, [enemy], 'range uses body distance and respects target limit');
assert.equal(range.IsRangeAffect(), true);
dragon.arrTargets = range.arrTargets;
range.doCast(); range.OnAnimationHit(); animationEnd();
assert.equal(enemy.hits, 2);

const ultimate = CSkillFactory.CreateSkill(dragon, 9999);
ultimate.arrTargets = [enemy];
dragon.curSkill = ultimate;
dragon.arrTargets = ultimate.arrTargets;
let presentation;
dragon.room = { ShowRoleAction: roles => { presentation = roles; } };
dragon.CastUltimateSkill();
assert.deepEqual(presentation, [enemy, dragon]);
assert.deepEqual(ultimate.arrTargets, [enemy], 'presentation must not add caster to damage targets');
let flashed = false;
dragon.playFlash(() => { flashed = true; });
assert.equal(flashed, true, 'missing flash animation must continue the cast');

// Exercise the repeated cast through all ten strikes and its completion callback.
dragon.play = (name, cb) => { if (cb) cb(); };
dragon.playSkillEffect = () => {};
dragon.SwitchToStand = () => {};
let completed = false;
const before = enemy.hits;
ultimate.doCast(() => { completed = true; });
for (let tick = 0; tick < 50; ++tick) if (ultimate.NeedTick()) ultimate.Tick();
assert.equal(enemy.hits - before, 10);
assert.equal(completed, true);
assert.equal(ultimate.NeedTick(), false);

const priest = role(1004);
const heal = priest.skills[0];
actors = [priest, mage];
mage.nCamp = priest.nCamp;
mage.setHP(mage._MaxHP / 2);
heal.OnSelectTarget();
assert.equal(heal.target, mage);
mage.setHP(mage._MaxHP);
heal.OnSelectTarget();
assert.equal(heal.target, null, 'healed target must not remain selected');
SkillsCfgData[8001] = { ...rangeCfg, ID: 8001, SkillClass: 5 };
assert.equal(CSkillFactory.CreateSkill(priest, 8001).constructor.name, 'CSkillRepeatedly');
SkillsCfgData[8002] = { ...rangeCfg, ID: 8002, SkillClass: 99 };
assert.throws(() => CSkillFactory.CreateSkill(priest, 8002), /Unknown skill class/);
console.log('PASS: all 19 character configs, skill loading, cooldown, missiles, AI selection, range, duplicate hits, ultimate isolation and invalid config handling');

// Exercise real HP settlement; only rendering and animation callbacks are stubbed.
const { CMissile } = load('skills/missile');
const { eMissileId } = load('BaseDef');
function combatRole(id) {
    const actor = role(id);
    actor.room = room;
    actor.setMaxHP(5000);
    actor.setHP(5000);
    actor.play = (name, cb) => { if (cb) cb(); };
    actor.playSkillEffect = () => {};
    actor.blinkRed = actor.blinkRestore = () => {};
    actor.scheduleOnce = () => {};
    actor.popDamage = value => { actor.lastDamage = value; };
    actor.popHealPoint = value => { actor.lastHeal = value; };
    actor.onDead = () => { actor.bIsAlive = false; actor.deaths = (actor.deaths || 0) + 1; };
    return actor;
}
const attacker = combatRole(4), victim = combatRole(1001);
attacker.ATK = 100; attacker.INT = 120;
victim.DEF = 30; victim.MDF = 40;
const physical = CSkillFactory.CreateSkill(attacker, 1001);
physical.target = victim;
physical.doCast();
assert.equal(victim.lastDamage, 80, 'physical = BaseData + ATK - DEF');
assert.equal(victim.getHP(), 4920);
victim.DEF = 9999;
physical.doCast();
assert.equal(victim.lastDamage, 0, 'high defense must not turn damage into healing');
assert.equal(victim.getHP(), 4920);
victim.DEF = 30;
const magic = CSkillFactory.CreateSkill(attacker, 1003);
victim.onHited(attacker, magic.GetEffectData());
assert.equal(victim.lastDamage, 90, 'magic = BaseData + INT - MDF');
SkillsCfgData[8010] = { ...SkillsCfgData[1002], ID: 8010, BaseData: 15 };
const healing = CSkillFactory.CreateSkill(attacker, 8010);
healing.target = victim;
victim.setHP(4500);
healing.doCast();
assert.equal(victim.lastHeal, 135, 'healing = BaseData + INT');
assert.equal(victim.getHP(), 4635);
victim.setHP(4990);
healing.target = victim;
healing.doCast();
assert.equal(victim.getHP(), 5000);
assert.equal(victim.lastHeal, 10, 'healing popup shows actual recovery');

SkillsCfgData[8011] = { ...rangeCfg, ID: 8011, TargetsLimit: 2 };
const aoe = CSkillFactory.CreateSkill(attacker, 8011);
const secondVictim = combatRole(1001);
secondVictim.DEF = 50;
aoe.arrTargets = attacker.arrTargets = [victim, secondVictim];
aoe.doCast();
assert.equal(victim.lastDamage, 80);
assert.equal(secondVictim.lastDamage, 60, 'each AoE target uses its own defense');
const direct = CSkillFactory.CreateSkill(attacker, 9999);
direct.arrTargets = [victim];
direct.doCast();
const hpBeforeTicks = victim.getHP();
for (let tick = 0; tick < 50; ++tick) if (direct.NeedTick()) direct.Tick();
assert.equal(hpBeforeTicks - victim.getHP(), 1000, 'type 3 uses BaseData for each of ten strikes');

for (const [id, missileId] of [[1003, eMissileId.emiFireball], [1004, eMissileId.emiDarkMagic],
    [1005, eMissileId.emiArrow], [1006, eMissileId.emiArrowSkull]]) {
    attacker.ATK = 100; attacker.INT = 120;
    const launch = CSkillFactory.CreateSkill(attacker, id);
    launch.target = victim;
    let emitted;
    attacker.LauncheMissile = (actualId, target, effect) => { emitted = { actualId, target, effect }; };
    launch.doCast();
    assert.equal(emitted.actualId, missileId);
    assert.equal(emitted.target, victim);
    const projectile = new CMissile();
    projectile.setCaster(attacker, emitted.effect);
    attacker.curSkill = physical;
    attacker.ATK = attacker.INT = 9999;
    projectile._isMoving = true;
    const hpBeforeImpact = victim.getHP();
    projectile.hitTarget(victim);
    const expectedDamage = id === 1003 || id === 1004 ? 90 : 80;
    assert.equal(hpBeforeImpact - victim.getHP(), expectedDamage, 'projectile retains its launch skill and attack stats');
    projectile.hitTarget(victim);
    assert.equal(hpBeforeImpact - victim.getHP(), expectedDamage, 'projectile applies damage only once');
}
victim.setHP(5);
victim.onHited(attacker, { skillType: 3, power: 100 });
victim.onHited(attacker, { skillType: 3, power: 100 });
assert.equal(victim.getHP(), 0);
assert.equal(victim.deaths, 1);
victim.onHeal(100);
assert.equal(victim.getHP(), 0, 'healing does not revive dead characters');
console.log('PASS: physical, magic, healing, direct damage, AoE defense, repeated strikes, four missile types, launch snapshots, duplicate impact and HP boundaries');
