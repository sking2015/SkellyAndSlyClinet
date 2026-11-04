import { gameStateMgr } from './GameStateMgr';
import { BattleState, BattleUnit, LootSettlement, newRequestId } from './Protocol';
import type { CCharacter } from './character/character';

interface QueuedEvent { action: string; request_id: string; data: any }
const KEY = 'battle_events_v1';

// One live battle. Persist critical events before network work or death animations.
export class BattleSync {
    static readonly instance = new BattleSync();
    private battle: BattleState = null;
    private bindings = new WeakMap<CCharacter, BattleUnit>();
    private assigned = new Set<string>();
    private queue: QueuedEvent[] = [];
    private seq = 0;
    private draining: Promise<boolean> = null;
    private lootListeners = new Set<(loot: LootSettlement, char: CCharacter) => void>();
    private sources = new Map<string, CCharacter>();
    onLoot(fn: (loot: LootSettlement, char: CCharacter) => void) {
        this.lootListeners.add(fn); return () => this.lootListeners.delete(fn);
    }
    get snapshot() { return this.battle; }
    get active() { return !!this.battle && this.battle.status === 'active'; }
    private persist() {
        localStorage.setItem(KEY, JSON.stringify({ player_id: gameStateMgr.playerId,
            battle_id: this.battle?.battle_id, seq: this.seq, queue: this.queue }));
    }
    async start(roomIndex: number, teamId: number): Promise<boolean> {
        if (!gameStateMgr.online) return true;
        const sync = await gameStateMgr.syncState();
        if (!sync.ok) {
            console.warn('[小入侵] state-sync 失败', { room_index: roomIndex, code: sync.code });
            return false;
        }
        if (gameStateMgr.activeBattle) {
            // No persisted scene/HP: retain events and wait for the server timeout.
            console.warn('[小入侵] 服务器已有活动战斗，等待恢复或超时', {
                room_index: roomIndex, battle_id: gameStateMgr.activeBattle.battle_id,
                expires_at: gameStateMgr.activeBattle.expires_at });
            await this.recover(); return false;
        }
        const encounter = sync.result.encounters?.find(e => e.room_index === roomIndex
            && e.available_at <= gameStateMgr.serverNow);
        if (!encounter) {
            console.warn('[小入侵] 服务器未返回本房间已到期遭遇', { room_index: roomIndex,
                server_now: gameStateMgr.serverNow, encounters: sync.result.encounters,
                current_stage_id: gameStateMgr.authority?.progress?.current_stage_id });
            return false;
        }
        const reply = await gameStateMgr.operation<{ battle: BattleState }>('battle-start', {
            encounter_id: encounter.encounter_id,
        });
        if (!reply.ok) {
            console.warn('[小入侵] 服务器拒绝 battle-start', { room_index: roomIndex,
                encounter_id: encounter.encounter_id, team_id: encounter.team_id, code: reply.code });
            return false;
        }
        this.battle = reply.result.battle;
        console.log('[小入侵] 服务器确认开战', { room_index: roomIndex,
            encounter_id: encounter.encounter_id, battle_id: this.battle.battle_id,
            team_id: this.battle.team_id, enemy_slots: this.battle.enemy_slots,
            enemy_unit_count: this.battle.units.filter(u => u.side === 'enemy').length });
        this.seq = this.battle.last_event_seq;
        this.assigned.clear(); this.bindings = new WeakMap(); this.queue = [];
        this.persist(); return true;
    }
    bind(char: CCharacter, side: 'own'|'enemy', roomIndex: number, slotKey?: number|string) {
        if (!gameStateMgr.online || !this.active || this.bindings.has(char)) return;
        const slot = side === 'enemy' && slotKey != null
            ? this.battle.enemy_slots?.find(slot => slot.position === slotKey) : null;
        if (side === 'enemy' && slotKey != null && !slot) throw new Error(`No server enemy slot: ${slotKey}`);
        const candidates = slot ? slot.unit_instance_ids.map(id => this.battle.units.find(u => u.unit_instance_id === id)).filter(Boolean)
            : this.battle.units;
        const unit = candidates.find(u => u.side === side && u.alive
            && u.config_id === char.eCharId && !this.assigned.has(u.unit_instance_id)
            && (side === 'enemy' || u.source_room_index === roomIndex));
        if (!unit) throw new Error(`No server battle instance for ${side}:${char.eCharId}`);
        this.assigned.add(unit.unit_instance_id);
        this.bindings.set(char, { ...unit });
    }
    died(char: CCharacter) {
        if (!gameStateMgr.online) return;
        const unit = this.bindings.get(char);
        if (!unit || !unit.alive) return;
        unit.alive = false;
        this.enqueue(unit.side === 'enemy' ? 'battle-enemy-hero-killed' : 'battle-own-unit-killed', {
            unit_instance_id: unit.unit_instance_id, life_no: unit.life_no,
        }, char);
    }
    revived(char: CCharacter, reviver: CCharacter) {
        if (!gameStateMgr.online) return;
        const unit = this.bindings.get(char), caster = this.bindings.get(reviver);
        if (!unit || !caster || !caster.alive || caster.side !== unit.side || unit.alive || unit.kind === 'soldier') throw new Error('Invalid revival');
        this.enqueue('battle-unit-revived', { unit_instance_id: unit.unit_instance_id,
            life_no: unit.life_no, reviver_unit_instance_id: caster.unit_instance_id }, char);
        unit.alive = true; ++unit.life_no;
    }
    private enqueue(action: string, fields: any, char?: CCharacter) {
        const eventId = newRequestId();
        const data = { battle_id: this.battle.battle_id, event_id: eventId, seq: ++this.seq,
            elapsed_ms: Math.max(0, gameStateMgr.serverNow - this.battle.started_at), ...fields };
        this.queue.push({ action, request_id: newRequestId(), data });
        if (char) this.sources.set(eventId, char);
        this.persist();
        void this.flush();
    }
    async recover() {
        if (this.draining) await this.draining;
        const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!stored || stored.player_id !== gameStateMgr.playerId) return;
        const battle = gameStateMgr.activeBattle;
        if (!battle || battle.battle_id !== stored.battle_id) {
            this.battle = null; this.queue = []; localStorage.removeItem(KEY); return;
        }
        this.battle = battle;
        this.seq = Math.max(stored.seq, battle.last_event_seq);
        const confirmed = new Set(battle.events.map(e => e.event_id));
        this.queue = stored.queue.filter(e => !confirmed.has(e.data.event_id));
        this.persist(); await this.flush();
    }
    flush(): Promise<boolean> {
        if (this.draining) return this.draining;
        this.draining = this.drain().then(result => { this.draining = null; return result; },
            error => { this.draining = null; throw error; });
        return this.draining;
    }
    private async drain(): Promise<boolean> {
        while (this.queue.length) {
            const event = this.queue[0];
            const reply = await gameStateMgr.operation(event.action, event.data, event.request_id);
            if (reply.code === 'BATTLE_CLOSED') {
                this.battle = null; this.queue = []; localStorage.removeItem(KEY); return true;
            }
            if (!reply.ok) {
                console.warn('[小入侵] 战斗事件未确认，保留队列重试', {
                    battle_id: event.data.battle_id, action: event.action,
                    seq: event.data.seq, code: reply.code, request_id: event.request_id });
                return false;
            }
            if (reply.result?.loot) {
                const char = this.sources.get(event.data.event_id);
                this.lootListeners.forEach(fn => {
                    try { fn(reply.result.loot, char); } catch (error) { console.error('[Loot presentation]', error); }
                });
            }
            this.sources.delete(event.data.event_id);
            this.queue.shift(); this.persist();
        }
        return true;
    }
    async end(win: boolean): Promise<boolean> {
        if (!gameStateMgr.online) return true;
        if (!this.active) return !gameStateMgr.activeBattle;
        if (!this.queue.some(e => e.action === 'battle-end')) {
            this.queue.push({ action: 'battle-end', request_id: newRequestId(), data: {
                battle_id: this.battle.battle_id, result: win ? 'win' : 'lose',
                duration_ms: Math.max(0, gameStateMgr.serverNow - this.battle.started_at),
                last_event_seq: this.seq, termination_reason: win ? 'elimination' : 'enemy_escape',
            } });
            this.persist();
        }
        if (!await this.flush()) return false;
        this.battle = null; this.queue = []; localStorage.removeItem(KEY); return true;
    }
}
