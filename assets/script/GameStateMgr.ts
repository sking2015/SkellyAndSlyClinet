import { director } from 'cc';
import { WebSession } from './WebSession';
import { GameConfig, SessionResult, GameState } from './GameConfig';
import { CGlobalData } from './GlobalData';
import { BattleState, PendingRequest, PlayerState, ProtocolResponse, newRequestId } from './Protocol';
export type LoginCallback = (result: SessionResult, data?: any) => void;
export interface OperationResult<R = any> { ok: boolean; code: string; result?: R; state?: PlayerState }
const PENDING_KEY = 'protocol_pending_v1';
class GameStateMgr {
    private _playerId = '';
    private _playerToken = '';
    private _currentState = GameState.LOGIN;
    private version = -1;
    private clockOffset = 0;
    private tail: Promise<any> = Promise.resolve();
    private listeners = new Set<() => void>();
    private errorListeners = new Set<(code: string) => void>();
    private pending: PendingRequest[] = [];
    private completed = new Map<string, { reply: ProtocolResponse; request: PendingRequest }>();
    private latest: PlayerState = null;
    get playerId() { return this._playerId; }
    get playerToken() { return this._playerToken; }
    get currentState() { return this._currentState; }
    get online() { return !GameConfig.ONLY_DEBUG_CLINTE; }
    get serverNow() { return Date.now() + this.clockOffset; }
    get stateVersion() { return this.version; }
    get activeBattle(): BattleState { return this.latest?.active_battle || null; }
    isRoomBattleLocked(index: number): boolean {
        const battle = this.activeBattle;
        if (!battle || battle.status !== 'active') return false;
        // Protocol v1 currently starts minor invasions only in the exterior (0).
        return index === (battle.room_index == null ? 0 : battle.room_index);
    }
    get authority() { return this.latest; }
    onState(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    onError(listener: (code: string) => void) { this.errorListeners.add(listener); return () => this.errorListeners.delete(listener); }
    private emit() { this.listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
    private remember(request: PendingRequest, reply: ProtocolResponse) {
        this.completed.set(request.request_id, { request, reply });
        if (this.completed.size > 256) this.completed.delete(this.completed.keys().next().value);
    }
    private savePending() { localStorage.setItem(PENDING_KEY, JSON.stringify(this.pending)); }
    private apply(reply: ProtocolResponse) {
        if (!reply.data?.state || reply.state_version < this.version) return;
        if (reply.data.state.config_version !== GameConfig.CONFIG_VERSION) throw new Error('CONFIG_MISMATCH');
        this.clockOffset = reply.server_time - Date.now();
        CGlobalData.instance.loadState(reply.data.state);
        this.latest = reply.data.state;
        this.version = reply.state_version;
        this.emit();
    }
    restoreDisplay() { if (this.latest) { CGlobalData.instance.loadState(this.latest); this.emit(); } }
    login(callback: LoginCallback) { void this.doLogin(callback); }
    private async doLogin(callback: LoginCallback) {
        try {
            this._playerId = localStorage.getItem(GameConfig.PLAYER_ID_KEY) || newRequestId();
            localStorage.setItem(GameConfig.PLAYER_ID_KEY, this._playerId);
            if (!this.online) {
                this._currentState = GameState.MAIN;
                callback(SessionResult.SUCCESS); return;
            }
            const reply = await WebSession.instance.requestLogin(this.playerId, newRequestId());
            if (reply.code !== 'OK') { callback(SessionResult.FAIL, reply); return; }
            this._playerToken = reply.data.result.token;
            localStorage.setItem(GameConfig.PLAYER_TOKEN_KEY, this.playerToken);
            this.version = -1;
            this.apply(reply);
            this.pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
                .filter((p: PendingRequest) => p.player_id === this.playerId);
            if (!await this.recover()) { callback(SessionResult.NETWORK_ERROR); return; }
            this._currentState = GameState.MAIN;
            callback(SessionResult.SUCCESS, reply.data);
        } catch (error) { console.error('[Login]', error); callback(SessionResult.NETWORK_ERROR); }
    }
    private async transmit(pending: PendingRequest): Promise<ProtocolResponse> {
        let error: unknown;
        for (let attempt = 0; attempt < 3; ++attempt) {
            try {
                let reply = await WebSession.instance.request(pending, this.playerToken);
                if (reply.code === 'TOKEN_EXPIRED' || reply.code === 'UNAUTHORIZED') {
                    const login = await WebSession.instance.requestLogin(this.playerId, newRequestId());
                    if (login.code !== 'OK') return reply;
                    this._playerToken = login.data.result.token;
                    localStorage.setItem(GameConfig.PLAYER_TOKEN_KEY, this.playerToken);
                    this.apply(login);
                    reply = await WebSession.instance.request(pending, this.playerToken);
                }
                return reply;
            }
            catch (e) { error = e; }
        }
        throw error;
    }
    private async recover(): Promise<boolean> {
        try {
            for (const pending of [...this.pending]) {
                const reply = await this.transmit(pending);
                this.apply(reply);
                this.remember(pending, reply);
                if (['TOKEN_EXPIRED', 'UNAUTHORIZED', 'INTERNAL_ERROR', 'EVENT_GAP'].indexOf(reply.code) >= 0) return false;
                this.pending = this.pending.filter(p => p.request_id !== pending.request_id);
                this.savePending();
            }
            return true;
        } catch (error) { console.error('[Pending requests retained]', error); return false; }
    }
    operation<R = any>(action: string, data: any, requestId = newRequestId()): Promise<OperationResult<R>> {
        if (!this.online) return Promise.resolve({ ok: true, code: 'OFFLINE' });
        const run = async (): Promise<OperationResult<R>> => {
            if (!this.playerToken) return { ok: false, code: 'UNAUTHORIZED' };
            const hadPending = this.pending.length > 0;
            if (!await this.recover()) return { ok: false, code: 'PENDING_REQUEST' };
            const recovered = this.completed.get(requestId);
            if (recovered) {
                if (recovered.request.action !== action || recovered.request.data !== JSON.stringify(data)) {
                    return { ok: false, code: 'REQUEST_ID_CONFLICT' };
                }
                const reply = recovered.reply;
                return { ok: reply.code === 'OK', code: reply.code, result: reply.data?.result, state: reply.data?.state };
            }
            if (hadPending && action !== 'state-sync') return { ok: false, code: 'RECOVERED_PENDING' };
            const pending = { player_id: this.playerId, action, data: JSON.stringify(data),
                request_id: requestId, state_version: this.version };
            try {
                this.pending.push(pending);
                this.savePending(); // Persist BEFORE sending a possibly irreversible operation.
                const reply = await this.transmit(pending);
                this.apply(reply);
                if (['TOKEN_EXPIRED', 'UNAUTHORIZED', 'INTERNAL_ERROR', 'EVENT_GAP'].indexOf(reply.code) < 0) {
                    this.pending = this.pending.filter(p => p.request_id !== requestId);
                    this.savePending();
                }
                if (reply.code === 'OK') this.remember(pending, reply);
                if (reply.code !== 'OK') console.warn('[Protocol]', action, reply.code, reply.message);
                return { ok: reply.code === 'OK', code: reply.code, result: reply.data?.result, state: reply.data?.state };
            } catch (error) {
                console.error('[Unknown outcome; request retained]', action, error);
                return { ok: false, code: 'NETWORK_ERROR' };
            }
        };
        const result = this.tail.then(run, run);
        this.tail = result.catch(() => {});
        return result.then(reply => {
            if (!reply.ok) this.errorListeners.forEach(fn => fn(reply.code));
            return reply;
        });
    }
    syncState() { return this.operation('state-sync', {}); }
    async RoomLvUpPromise(index: number): Promise<[SessionResult, any]> {
        const reply = await this.operation('room-lv-up', { room_index: index });
        return [reply.ok ? SessionResult.SUCCESS : SessionResult.FAIL, reply.state];
    }
    async RoomLvUp(index: number, cb: Function) { cb(...await this.RoomLvUpPromise(index)); }
    changeScene(name: string) { director.loadScene(name); }
    logout() {
        this._playerToken = ''; this._currentState = GameState.LOGIN;
        localStorage.removeItem(GameConfig.PLAYER_TOKEN_KEY);
    }
}
export const gameStateMgr = new GameStateMgr();
