import * as nemSdk from "nem-sdk";
const nem = nemSdk.default;
import { CoolMessage } from '../../../CoolMessage';
import { ICoolClientTransport } from '../../../ICoolClientTransport';
import { ICoolStorage } from '../../../ICoolStorage';

export class CoolStorageProxy implements ICoolStorage {
    private id: string = "nis1";
    private transport: ICoolClientTransport|null = null;
    
    constructor() {;
    }

    public setTransport(transport: ICoolClientTransport) {
        this.transport = transport;
    }

    public getId(): string {
        return this.id;
    }

    public willHandle(data: any): boolean {
        if (! data) {
            return false;
        }
        try {
            // check that the value is JSON with relevant fields
            const json = JSON.parse(data);
            return (json && json.type === this.id && [1,2].includes(json.version) && json.payload);
        } catch (e) {
            return false;
        }
    }

    public handle(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // if value was provided then parse it into the result
            if (data) {
                try {
                    const json = JSON.parse(data);
                    const message = new CoolMessage(json.type, json.version, json.payload, json.meta);
                    resolve(message);
                } catch (e) {
                    reject("Can not handle.");
                }
            } else {
                reject("Can not handle null.");
            }
        });
    }

    public sign(entity: any, meta: any): Promise<any> {
        // fix: de-hex message payload if it is present and set to be encrypted; nem-sdk (message.js) hexed it because "we" are isHW
        if (entity.message && entity.message.type === 2 && entity.message.payload) {
            entity.message.payload = nem.utils.format.hexToUtf8(entity.message.payload);
        }
        const self = this;
        const message: CoolMessage = new CoolMessage(this.id, 1, entity, meta);
        return new Promise((resolve, reject) =>  {
            if (self.transport) {
                self.transport.request(message).then(value => {
                    if (value.payload /** && maybe add sanity check - check crc/hash of original/unsigned from meta? */) {
                        resolve(value.payload);
                    } else {
                        reject("Not signed.");
                    }
                }, error => {
                    reject(error);
                });
            } else {
                reject("Transport not set.")
            }
        });
    }

    public decrypt(payload: any, pubkey: any): Promise<any> {
        const data = {
            payload,
            pubkey
        };
        const self = this;
        const message = new CoolMessage(this.id, 2, data);
        return new Promise((resolve, reject) =>  {
            if (self.transport) {
                self.transport.request(message).then(value => {
                    // chksum check; chksum is now just sanity - beginning of the encrypted message
                    if (value.meta && message.payload.payload.startsWith(value.meta.chksum)) {
                        resolve(value.payload);
                    } else {
                        reject("Wrong checksum.");
                    }
                }, error => {
                    reject(error);
                });
            } else {
                reject("Transport not set.");
            }
        });
    }
}
