import * as JSQR from "jsqr";
const jsQR = JSQR.default;
import * as QRCodeFactory from "qrcode-generator";

export class QR {

    /**
     * Static helper for generating img element with QR from given data
     * 
     * @param data to generate QR from
     * @param destination jquery selector where resulted image will be placed
     */
    public static generateQR(data: any, destination: JQuery): HTMLImageElement {
        // create and display QR first
        const code = QRCodeFactory(0, 'M');
        const json = JSON.stringify(data);
        code.addData(json);
        code.make();
        const img = document.createElement("img");
        img.src = code.createDataURL(4);
        img.style.width = "90%";
        img.style.height = "90%";
        img.alt = json;
        if (destination) {
            destination.html(img);
        }
        // also, return generated the element that got created
        return img;
    }

    private scanStarted: boolean;
    private scanDestination: JQuery | null;
    private video: HTMLVideoElement | null;
    private canvasElement: HTMLCanvasElement | null; 
    private canvas: CanvasRenderingContext2D | null; 
    private continueDetectInterval: NodeJS.Timeout | null;
    private openedVideoStream: MediaStream | null;

    constructor() {
        this.scanStarted = false;
        this.scanDestination = null;
        this.video = null;
        this.canvasElement = null;
        this.canvas = null;
        this.continueDetectInterval = null;
        this.openedVideoStream = null;
    }

    /**
     * Starts new QR code scan
     * 
     * @param acceptFn callback for sanity check of scanned data
     * @param callbackFn callback delivering the scanned data (which passed acceptFn)
     * @param destination jquery selector where camera stream will be rendered
     * @param continueScanning don't stop scanning after callbackFn was invokded - will invoke callbackFn and deliver data continuously.
     */
    public scanQR(acceptFn: (data: string) => boolean, callbackFn: (data: string | null) => void, destination: JQuery, continueScanning: boolean) {
        this.scanStarted = true;
        this.scanDestination = destination;

        const cvsElement = document.createElement('canvas');
        const videoElement = document.createElement('video');
        cvsElement.id = "scanQrcodeCvs";
        cvsElement.hidden = true;

        videoElement.style.width = "90%";
        videoElement.style.margin = "10px";
        
        this.scanDestination.append(cvsElement);
        this.scanDestination.append(videoElement);
        
        this.canvasElement = document.getElementById(cvsElement.id) as HTMLCanvasElement;
        if (this.canvasElement) {
            this.canvas = this.canvasElement.getContext("2d");
        }
        
        const self = this;
        navigator.mediaDevices.getUserMedia({ video: { width: 9999, height: 9999, facingMode: "environment" } }).then((stream) => {
            self.video = document.getElementsByTagName('video')[0];
            if (! self.video) {
                throw new Error("Missing mandatory 'video' element.");
            }
            self.video.srcObject = stream;
            self.openedVideoStream = stream;
            self.video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
            self.video.play();
            self._continueDetectQR(acceptFn, callbackFn, continueScanning);
        }).catch((err) => {
            // console.error("Couldn't get camera: " + err);
            self.stopScanQR();
            callbackFn(null);
        });
    }

    /**
     * Stops scanning. Clears element for rendering video
     */
    public stopScanQR() {
        if (this.scanStarted) {
            this.scanStarted = false;
            if (this.continueDetectInterval) {
                clearInterval(this.continueDetectInterval); // stop the scanning loop
            }
            if (this.openedVideoStream) {
                this.openedVideoStream.getTracks()[0].stop(); // stop stream
            }
            if (this.video) {
                this.video.pause(); // video pause;
            }
            if (this.scanDestination) {
                this.scanDestination.html("");
                this.scanDestination = null;
            }
        }
    }

    /**
     * Starts the scanning loop - invoke single scan every 1000ms until stopped
     */
    private _continueDetectQR (acceptFn: (data: string) => boolean, callbackFn: (data: string | null) => void, continueScanning: boolean) {
        const self = this;
        this.continueDetectInterval = setInterval(() => {
            self._tick(acceptFn, callbackFn, continueScanning);
        }, 1000);
    }

    /**
     * Single scan
     */
    private _tick(acceptFn: (data: string) => boolean, callbackFn: (data: string) => void, continueScanning: boolean) {
        if (! (this.video && this.canvasElement && this.canvas)) {
            throw new Error("Missing argument.");
        }
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.canvasElement.height = this.video.videoHeight;
            this.canvasElement.width = this.video.videoWidth;

            this.canvas.drawImage(this.video, 0, 0, this.canvasElement.width, this.canvasElement.height);
            const imageData = this.canvas.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && acceptFn(code.data)) {
                try {
                    // console.log('success detect QR, close camera: ' + code.data);
                    // let data = JSON.parse(code.data)
                    if (! continueScanning) {
                        this.stopScanQR();
                    }
                    callbackFn(code.data);
                } catch (err) {
                    // console.log('continue to detect Qrcode...');
                    // console.log(err.stack);
                }
            } else if (code) {
                // console.log("QR not accepted: " + code.data);
            }
        }
    }
}