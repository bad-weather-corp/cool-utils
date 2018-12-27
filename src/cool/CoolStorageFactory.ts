import { ICoolStorage } from "./ICoolStorage";
import { CoolStorage } from "./impl/modules/nis1/CoolStorage";
import { CoolStorageProxy } from "./impl/modules/nis1/CoolStorageProxy";

export class CoolStorageFactory {
    public static createCoolStorage(type: string): ICoolStorage {
        // TODO: hard-coded, could get registered/injected at runtime
        if (type === 'nis1') {
            return new CoolStorage();
        }
        throw new Error("Unhandled type: " + type);
    }

    public static createCoolStorageProxy(type: string): ICoolStorage {
        // TODO: hard-coded, could get registered/injected at runtime
        if (type === 'nis1') {
            return new CoolStorageProxy();
        }
        throw new Error("Unhandled type: " + type);
    }
}
