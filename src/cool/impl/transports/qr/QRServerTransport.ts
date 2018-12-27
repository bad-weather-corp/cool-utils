import { QR } from "../../../../utils/qr";
import { CoolMessage } from "../../../CoolMessage";
import { ICoolServerTransport } from "../../../ICoolServerTransport";
import { ICoolStorage } from "../../../ICoolStorage";

export class QRServerTransport implements ICoolServerTransport {
    private storage: ICoolStorage;
    private qrDestination: JQuery|null = null;
    private scanDestination: JQuery|null = null;
    private qr = new QR();

    constructor(storage: ICoolStorage) {
        this.storage = storage;
    }

    public setDestinations(qrDestination: JQuery, scanDestination: JQuery) {
        this.qrDestination = qrDestination;
        this.scanDestination = scanDestination;
    }

    public handleRequest(): Promise<CoolMessage> {
        const self = this;
        return new Promise<CoolMessage>((resolve, reject) => {
            if (self.scanDestination) {
                self.qr.scanQR((value) => {
                    // sanity check
                    return self.storage.willHandle(value);
                }, (value) => {
                    self.storage.handle(value).then(res => {
                        if (self.qrDestination) {
                            QR.generateQR(res, self.qrDestination);
                        }
                        resolve(res);
                    }, rej => {
                        reject(rej);
                    });
                }, self.scanDestination, true);
            } else {
                reject("Null scan destination element.");
            }
        });
    }

    public cleanup() {
        this.qr.stopScanQR();
    }
}