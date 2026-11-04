import { GameConfig } from './GameConfig';
import { Md5 } from 'ts-md5';
import { actionRoute, PendingRequest, ProtocolResponse } from './Protocol';
const SECRET_KEY = 'I want money~!money~!money~!Give me money~!';
export class WebSession {
    private static _instance: WebSession;
    static get instance(): WebSession { return this._instance || (this._instance = new WebSession()); }
    private async post<R>(route: string, body: any): Promise<ProtocolResponse<R>> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(GameConfig.ADDRESS + route, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body), signal: controller.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const reply = await response.json();
            if (reply.protocol_version !== 1 || reply.request_id !== body.request_id
                || typeof reply.code !== 'string' || !Number.isSafeInteger(reply.state_version)) {
                throw new Error('Invalid protocol response');
            }
            if (reply.code === 'OK' && (!reply.data?.state || reply.data.result == null)) {
                throw new Error('Missing authoritative state/result');
            }
            return reply;
        } finally { clearTimeout(timeout); }
    }
    requestLogin(playerId: string, requestId: string) {
        return this.post<{ player_id: string; token: string }>('/api/login', {
            protocol_version: 1, playerId, timestamp: Date.now(), request_id: requestId,
        });
    }
    request<R>(pending: PendingRequest, token: string): Promise<ProtocolResponse<R>> {
        const timestamp = Math.floor(Date.now() / 1000);
        const { player_id, action, data, request_id, state_version } = pending;
        const sign = Md5.hashStr(player_id + token + timestamp + action + data
            + request_id + state_version + 1 + SECRET_KEY);
        return this.post<R>(actionRoute(action), {
            protocol_version: 1, player_id, token, timestamp, action, data, request_id, state_version, sign,
        });
    }
}
