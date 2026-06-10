import { director } from 'cc';
import { WebSession } from './WebSession';
import { GameConfig, SessionResult, GameState } from './GameConfig';
import { CGlobalData } from './GlobalData';
import { IPlayer, IPlayerData } from './BaseDef';

/**
 * 登录回调类型
 */
export type LoginCallback = (result: SessionResult, data?: any) => void;

/**
 * 全局游戏状态管理器
 */
class GameStateMgr {
    private static _instance: GameStateMgr = null;
    private _playerId: string = '';
    private _playerToken: string = '';
    private _currentState: GameState = GameState.LOGIN;

    private constructor() { }

    public static get instance(): GameStateMgr {
        if (!GameStateMgr._instance) {
            GameStateMgr._instance = new GameStateMgr();
        }
        return GameStateMgr._instance;
    }

    public get playerId(): string {
        return this._playerId;
    }

    public get playerToken(): string {
        return this._playerToken;
    }

    public get currentState(): GameState {
        return this._currentState;
    }

    private generateUUID(): string {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 15);
        const randomPart2 = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${randomPart}-${randomPart2}`;
    }

    private getOrCreatePlayerId(): string {
        const savedId = localStorage.getItem(GameConfig.PLAYER_ID_KEY);
        if (savedId) {
            console.log('[GameStateMgr] Found saved player ID:', savedId);
            return savedId;
        }

        const newId = this.generateUUID();
        console.log('[GameStateMgr] Generated new player ID:', newId);

        try {
            localStorage.setItem(GameConfig.PLAYER_ID_KEY, newId);
        } catch (e) {
            console.warn('[GameStateMgr] Failed to save player ID:', e);
        }

        return newId;
    }

    /**
     * 执行登录
     */
    public login(callback: LoginCallback): void {
        this.doLogin(callback);
    }

    //public room

    /**
     *  更换监工
     */
    public changeOverseer(callback: LoginCallback): void {
        this.doLogin(callback);
    }


    private async doLogin(callback: LoginCallback): Promise<void> {
        console.log('[GameStateMgr] Starting login...');

        this._playerId = this.getOrCreatePlayerId();
        console.log('[GameStateMgr] Player ID:', this._playerId);

        const [result, data] = await WebSession.instance.requestLogin(this._playerId);

        console.log("login request respond data", data);

        if (result === SessionResult.SUCCESS) {
            if (data?.token) {
                this._playerToken = data.token;
                try {
                    localStorage.setItem(GameConfig.PLAYER_TOKEN_KEY, data.token);
                } catch (e) {
                    console.warn('[GameStateMgr] Failed to save token:', e);
                }
            }
            CGlobalData.instance.loadData(data.data);
            this._currentState = GameState.MAIN;
            console.log('[GameStateMgr] Login successful!');
        } else {
            console.log('[GameStateMgr] Login failed, result:', result);
        }

        callback?.(result, data);
    }

    public changeScene(sceneName: string): void {
        console.log('[GameStateMgr] Changing scene to:', sceneName);
        director.loadScene(sceneName, (error) => {
            if (error) {
                console.error('[GameStateMgr] Failed to load scene:', error);
            } else {
                console.log('[GameStateMgr] Scene changed to:', sceneName);
            }
        });
    }

    public logout(): void {
        console.log('[GameStateMgr] Logging out...');
        this._playerToken = '';
        this._currentState = GameState.LOGIN;

        try {
            localStorage.removeItem(GameConfig.PLAYER_TOKEN_KEY);
        } catch (e) {
            console.warn('[GameStateMgr] Failed to clear token:', e);
        }
    }

    public async RoomGatherPromise(index: number): Promise<[SessionResult, IPlayerData]> {
        const gameData = { room_index: index }
        const [result, data] = await WebSession.instance.requestGather(this.playerId, this.playerToken, gameData)

        return [result, data];
    }

    public async RoomGather(index: number, cb: Function) {
        const [result, data] = await this.RoomGatherPromise(index);
        cb(result, data);
    }

    public async RoomLvUpPromise(index: number): Promise<[SessionResult, IPlayerData]> {
        const gameData = { room_index: index }
        const [result, data] = await WebSession.instance.requestRoomLvUp(this.playerId, this.playerToken, gameData)
        if (result === SessionResult.SUCCESS) {
            CGlobalData.instance.loadData(data);
        }

        return [result, data];
    }

    public async RoomLvUp(index: number, cb: Function) {
        const [result, data] = await this.RoomLvUpPromise(index);
        cb(result, data)
    }
}

export const gameStateMgr = GameStateMgr.instance;
