/** 自动生成 TS 配置 */

export interface ITeamConfig {
    readonly ID: number;
    readonly Name: string;
    readonly Level: number;
    readonly Members: string;
    readonly DropID: number;
    readonly ExtraExp: number;
    readonly TeamType: string;
    readonly StageID: number;
}

export const TeamConfigData: Record<string | number, ITeamConfig> = {
    1: {
        "ID": 1,
        "Name": "Minor Test Squad1",
        "Level": 1,
        "Members": "1:2,1:2,2:1",
        "DropID": 1,
        "ExtraExp": 150,
        "TeamType": "Minor",
        "StageID": 1
    },
    2: {
        "ID": 2,
        "Name": "Minor Test Squad2",
        "Level": 1,
        "Members": "1:3,3:1",
        "DropID": 2,
        "ExtraExp": 150,
        "TeamType": "Minor",
        "StageID": 1
    },
    3: {
        "ID": 3,
        "Name": "Minor Test Squad3",
        "Level": 1,
        "Members": "1:2,2:1,3:1",
        "DropID": 3,
        "ExtraExp": 150,
        "TeamType": "Minor",
        "StageID": 1
    },
    10: {
        "ID": 10,
        "Name": "Major Test Squad1",
        "Level": 5,
        "Members": "1:2,2:1,3:1,4:2",
        "DropID": 14,
        "ExtraExp": 550,
        "TeamType": "Major",
        "StageID": 1
    },
    11: {
        "ID": 11,
        "Name": "Minor Test Squad4",
        "Level": 5,
        "Members": "1:2,2:2",
        "DropID": 4,
        "ExtraExp": 280,
        "TeamType": "Minor",
        "StageID": 2
    },
    12: {
        "ID": 12,
        "Name": "Minor Test Squad5",
        "Level": 5,
        "Members": "1:3,3:2",
        "DropID": 5,
        "ExtraExp": 280,
        "TeamType": "Minor",
        "StageID": 2
    },
    13: {
        "ID": 13,
        "Name": "Minor Test Squad6",
        "Level": 5,
        "Members": "1:3,4:2",
        "DropID": 6,
        "ExtraExp": 280,
        "TeamType": "Minor",
        "StageID": 2
    },
    20: {
        "ID": 20,
        "Name": "Major Test Squad7",
        "Level": 10,
        "Members": "1:3,2:2,3:2,4:2",
        "DropID": 15,
        "ExtraExp": 1000,
        "TeamType": "Major",
        "StageID": 2
    }
};
