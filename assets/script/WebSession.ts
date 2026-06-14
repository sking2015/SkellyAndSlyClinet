

import { GameConfig, SessionResult, GameState, eWebAction } from './GameConfig';
import { IPlayer, IPlayerData } from './BaseDef';
import { Md5 } from 'ts-md5';

const SECRET_KEY = "I want money~!money~!money~!Give me money~!";

export class WebSession {
    private static _instance: WebSession = null;

    public static get instance(): WebSession {
        if (!WebSession._instance) {
            WebSession._instance = new WebSession();
        }
        return WebSession._instance;
    }

    //登录是特别的，不需要额外验证，只要是有这个playerId就行。
    //以后再考虑和google邮箱，facebook id等进行关联
    public async requestLogin(playerId: string): Promise<[SessionResult, IPlayer]> {
        const url = GameConfig.LOGIN_URL;
        console.log('[GameStateMgr] Request URL:', url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: playerId,
                    timestamp: Date.now(),
                }),
            });

            if (!response.ok) {
                console.error('[GameStateMgr] Network error:', response.status);
                return [SessionResult.NETWORK_ERROR, null];
            }

            const data = await response.json();
            console.log('[GameStateMgr] Login response:', data);

            if (data?.code === 0) {
                return [SessionResult.SUCCESS, data.data];
            } else {
                return [SessionResult.FAIL, data];
            }
        } catch (error) {
            console.error('[GameStateMgr] Login request failed:', error);
            return [SessionResult.NETWORK_ERROR, null];
        }
    }

    public async requestRoomLvUp(playerID: string, token: string, gameData: any): Promise<[SessionResult, IPlayerData]> {
        const url = GameConfig.ROOM_URL;
        const actiton = eWebAction.ewa_room_lvup;
        return this.sendGameData(url, playerID, token, actiton, gameData);
    }

    public async requestGather(playerID: string, token: string, gameData: any): Promise<[SessionResult, IPlayerData]> {
        const url = GameConfig.ROOM_URL;
        const actiton = eWebAction.ewa_room_gather;
        return this.sendGameData(url, playerID, token, actiton, gameData);
    }

    private async sendGameData(url: string, playerID: string, token: string, action: string, gameData: any): Promise<[SessionResult, IPlayerData]> {
        const timestamp = Math.floor(Date.now() / 1000);

        // 保持和服务器完全一致的拼接顺序
        const strData: string = JSON.stringify(gameData);
        const originStr = playerID + token + timestamp + action + strData + SECRET_KEY;
        const sign = Md5.hashStr(originStr); // 计算出 MD5

        const body = {
            player_id: playerID,
            token: token,
            timestamp: timestamp,
            action: action,
            data: strData,
            sign: sign
        };

        if (GameConfig.ONLY_DEBUG_CLINTE) {
            return [SessionResult.SUCCESS, null];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error('[GameStateMgr] Network error:', response.status);
            return [SessionResult.NETWORK_ERROR, null];
        }

        const data = await response.json();
        console.log('[GameStateMgr] Login response:', data);

        if (data?.code === 0) {
            return [SessionResult.SUCCESS, data.data];
        } else {
            return [SessionResult.FAIL, data];
        }
    } catch(error) {
        console.error('[GameStateMgr] Login request failed:', error);
        return [SessionResult.NETWORK_ERROR, null];
    }
}