/** 自动生成 TS 配置 */

export interface IRoomConfig {
    readonly RoomType: number;
    readonly RoomName: string;
}

export const RoomConfigData: Record<string | number, IRoomConfig> = {
    1: {
        "RoomType": 1,
        "RoomName": "Lumber Mill"
    },
    2: {
        "RoomType": 2,
        "RoomName": "Metal Workshop"
    },
    3: {
        "RoomType": 3,
        "RoomName": "Crystal Mine"
    },
    10: {
        "RoomType": 10,
        "RoomName": "CastleOutSide"
    },
    11: {
        "RoomType": 11,
        "RoomName": "MAD Alchemy Lab"
    },
    12: {
        "RoomType": 12,
        "RoomName": "Battle Room"
    },
    13: {
        "RoomType": 13,
        "RoomName": "Barrack"
    },
    14: {
        "RoomType": 14,
        "RoomName": "Castle Door"
    }
};
