import { QR } from "../../../utils/qr";
import { CoolMessage } from "../../CoolMessage";
import { ICoolClientTransport } from "../../ICoolClientTransport";


export class QRClientTransport implements ICoolClientTransport {
    private destinationQR: JQuery;
    private destinationScan: JQuery;
    private qr = new QR();
    constructor(destinationQR: JQuery, destinationScan: JQuery) {
        this.destinationQR = destinationQR;
        this.destinationScan = destinationScan;
    }

    public request(message: CoolMessage): Promise<CoolMessage> {
        QR.generateQR(message, this.destinationQR);
        const self = this;
        return new Promise<CoolMessage>((resolve, reject) => {
            self.qr.scanQR((value) => {
                // sanity check
                if (value) {
                    // check that the value is JSON with relevant fields
                    const json = JSON.parse(value);
                    return (json && json.type === 'nis1' && json.version === 1 && json.payload);
                } else {
                    // unexpected data
                    return false;
                }
            }, (value) => {
                // if value was provided then parse it into the result
                if (value) {
                    const json = JSON.parse(value);
                    message = new CoolMessage(json.type, json.version, json.payload, json.meta);
                    resolve(message);
                } else {
                    reject();
                }
            }, self.destinationScan, true);
        });
    }

    public cleanup() {
        this.qr.stopScanQR();
    }
}