

import { GameConfig, SessionResult, GameState } from './GameConfig';

export class WebSession {
    private static _instance: WebSession = null;

    public static get instance(): WebSession {
        if (!WebSession._instance) {
            WebSession._instance = new WebSession();
        }
        return WebSession._instance;
    }

    public async requestLogin(playerId: string): Promise<[SessionResult, any]> {
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
}