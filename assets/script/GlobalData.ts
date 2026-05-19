import { eOverseerType } from './BaseDef';

export class COverseerData {
    //类型
    eType: eOverseerType = eOverseerType.eotNone;
    //目前只有等级，如果为0表示未解锁
    level: number = 0;

    constructor(eType: eOverseerType, nLvel: number) {
        this.eType = eType;
        this.level = nLvel;
    }
}

//全局数据类，用来保存从服务器下发的数据
export class CGlobalData {
    private mapOverseer: Map<eOverseerType, COverseerData> = new Map();
    constructor() {
        console.log("全局数据类开始构造");
        this.initOverseerData();
    }

    private static _instance: CGlobalData = null;


    public static get instance(): CGlobalData {
        if (!CGlobalData._instance) {
            CGlobalData._instance = new CGlobalData();
        }
        return CGlobalData._instance;
    }


    //监工目前只有有限种类,所以eotWizard后面的lv都设为0
    initOverseerData() {
        for (let eType = eOverseerType.eotEyetyarnt; eType != eOverseerType.eotMax; ++eType) {
            let lv: number = 1;
            if (eType > eOverseerType.eotWizard) {
                lv = 0;
            }

            this.mapOverseer.set(eType, new COverseerData(eType, lv));
        }
    }

    //遍历所有监工
    foreachOverseers(callback: Function) {
        this.mapOverseer.forEach((data, eType) => {
            callback(data);
        })
    }
}