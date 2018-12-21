import * as nemSdk from "nem-sdk";
const nem = nemSdk.default;
import { CoolMessage } from '../../CoolMessage';
import { ICoolStorage } from '../../ICoolStorage';
import { ICoolClientTransport } from '../../ICoolClientTransport';

export class CoolStorageProxy implements ICoolStorage {
    private transport: ICoolClientTransport;
    
    constructor(transport: ICoolClientTransport) {
        this.transport = transport;
    }

    public sign(entity: any, meta: any): Promise<any> {
        // fix: de-hex message payload if it is present and set to be encrypted; nem-sdk (message.js) hexed it because "we" are isHW
        if (entity.message && entity.message.type === 2 && entity.message.payload) {
            entity.message.payload = nem.utils.format.hexToUtf8(entity.message.payload);
        }

        const message: CoolMessage = new CoolMessage('nis1', 1, entity, meta);
        return new Promise((resolve, reject) =>  {
            this.transport.request(message).then(value => {
                resolve(value.payload);
            }, error => {
                reject(error);
            });
        });
    }
}
