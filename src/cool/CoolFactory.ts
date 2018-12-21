import { ICoolStorage } from "./ICoolStorage";
import { ICoolClientTransport } from "./ICoolClientTransport";
import { CoolStorage } from "./impl/nis1v1/CoolStorage";
import { CoolStorageProxy } from "./impl/nis1v1/CoolStorageProxy";

export class CoolFactory {
    public static createCoolStorage(type: string, version: number): ICoolStorage {
        if (type === 'nis1') {
            if (version === 1) {
                return new CoolStorage();
            }
        }
        throw new Error("Unhandled combination of type and version: " + type + ":" + version);
    }

    public static createCoolStorageProxy(type: string, version: number, transport: ICoolClientTransport): ICoolStorage {
        if (type === 'nis1') {
            if (version === 1) {
                return new CoolStorageProxy(transport);
            }
        }
        throw new Error("Unhandled combination of type and version: " + type + ":" + version);
    }
}
