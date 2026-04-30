/**
 * 游戏配置常量
 */
export class GameConfig {
    // 服务器配置
    public static readonly SERVER_HOST: string = '127.0.0.1';
    public static readonly SERVER_PORT: number = 8080;
    public static readonly API_LOGIN: string = '/api/login';

    // 完整的登录API地址
    public static get LOGIN_URL(): string {
        return `http://${this.SERVER_HOST}:${this.SERVER_PORT}${this.API_LOGIN}`;
    }

    // 本地存储键名
    public static readonly PLAYER_ID_KEY: string = 'player_id';
    public static readonly PLAYER_TOKEN_KEY: string = 'player_token';

    // 游戏状态键名
    public static readonly GAME_STATE_KEY: string = 'game_state';
}

/**
 * 登录结果
 */
export enum LoginResult {
    SUCCESS = 0,
    FAIL = 1,
    NETWORK_ERROR = 2,
    SERVER_ERROR = 3,
}

/**
 * 游戏状态
 */
export enum GameState {
    LOGIN = 'login',
    MAIN = 'main',
    GAME = 'game',
}
