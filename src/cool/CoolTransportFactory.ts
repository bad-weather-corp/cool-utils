import { ICoolClientTransport } from "./ICoolClientTransport";
import { ICoolServerTransport } from "./ICoolServerTransport";
import { ICoolStorage } from "./ICoolStorage";
import { QRClientTransport } from "./impl/transports/qr/QRClientTransport";
import { QRServerTransport } from "./impl/transports/qr/QRServerTransport";

export class CoolTransportFactory {
    public static createServerTransport(type: string, storage: ICoolStorage): ICoolServerTransport {
        if (type === 'qr') {
            return new QRServerTransport(storage);
        }
        throw Error("Unknown type: " + type);
    }

    public static createClientTransport(type: string, storage: ICoolStorage): ICoolClientTransport {
        if (type === 'qr') {
            return new QRClientTransport(storage);
        }
        throw Error("Unknown type: " + type);
    }
}