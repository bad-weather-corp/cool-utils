import { QR } from "../../../utils/qr";
import { CoolMessage } from "../../CoolMessage";
import { ICoolServerTransport } from "../../ICoolServerTransport";
import { CoolStorage } from "./CoolStorage";

export class QRServerTransport implements ICoolServerTransport {
    private storage = new CoolStorage();
    private destinationScan: JQuery;
    private qr = new QR();
    constructor(destinationScan: JQuery) {
        this.destinationScan = destinationScan;
    }

    public handleRequest(): Promise<CoolMessage> {
        const self = this;
        return new Promise<CoolMessage>((resolve, reject) => {
            self.qr.scanQR((value) => {
                // sanity check
                if (value) {
                    // check that the value is JSON with relevant fields
                    const json = JSON.parse(value);
                    return (json && json.type ==='nis1' && json.version === 1 && json.payload);
                } else {
                    // unexpected data
                    return false;
                }
            }, (value) => {
                // if value was provided then parse it into the result
                if (value) {
                    const json = JSON.parse(value);
                    self.storage.sign(json.payload, json.meta).then(signed => {
                        const message = new CoolMessage(json.type, json.version, signed, json.meta);
                        resolve(message);
                    }, error => {
                        reject("Something wrong during signing: " + error);
                    });
                } else {
                    reject();
                }
            }, self.destinationScan, true);
        });
    }

    public setWallet(wallet: any, password: string): void {
        this.storage.reset();
        this.storage.addWallet(wallet, password);
    }

    public cleanup() {
        this.storage.reset();
        this.qr.stopScanQR();
    }
}