export class CoolMessage {
    public type: string;
    public version: number;
    public payload: any;
    public meta: any;
    constructor(type: string, version: number, payload: any, meta?:any) {
        this.type = type;
        this.version = version;
        this.payload = payload;
        this.meta = meta?meta:undefined;
    }
}
