/**
 * 游戏配置常量
 */
export class GameConfig {
    // 服务器配置
    public static readonly SERVER_HOST: string = '127.0.0.1';
    public static readonly SERVER_PORT: number = 8080;
    public static readonly ADDRESS: string = `http://${this.SERVER_HOST}:${this.SERVER_PORT}`


    //具体请求...

    //第一个是登录
    public static readonly API_LOGIN: string = '/api/login';
    //改变监工
    public static readonly API_CHANGE_OVERSEER: string = '/api/change_overseer'




    //完整请求地址
    // 登录API地址
    public static readonly LOGIN_URL: string = this.ADDRESS + this.API_LOGIN;

    // 请求改变监工地址
    public static readonly CHANGE_OS_URL: string = this.ADDRESS + this.API_CHANGE_OVERSEER;

    // 本地存储键名
    public static readonly PLAYER_ID_KEY: string = 'player_id';
    public static readonly PLAYER_TOKEN_KEY: string = 'player_token';

    // 游戏状态键名
    public static readonly GAME_STATE_KEY: string = 'game_state';
}

/**
 * 会话结果
 */
export enum SessionResult {
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
