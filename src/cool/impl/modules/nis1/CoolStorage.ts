import * as nemSdk from "nem-sdk";
const nem = nemSdk.default;
import { CoolMessage } from "../../../CoolMessage";
import { ICoolStorage } from '../../../ICoolStorage';

export class CoolStorage implements ICoolStorage {
    private id: string = "nis1";
    private wallets: any = [];
    private selectedWallet: any;
    private selectedAccount: any;
    constructor() {
        this.reset();
    }
    
    public reset():void {
        this.selectedWallet = undefined;
        this.selectedAccount = undefined;
        this.wallets = [];
    }

    public addWalletBase64(walletBase64: string, password: string) {
        this.addWallet(this.base64Decode(walletBase64), password);
    }

    public addWallet(wallet: any, password: string) {
        this.wallets.push(
            [ wallet, password ]
        );
        if (!this.selectedWallet) {
            this.selectedWallet = this.wallets[0]
            this.selectedAccount = this.selectedWallet[0].accounts[0];
        }
        this.wallets.push(wallet);
    }

    public willHandle(data: any): boolean {
        if (! data) {
            return false;
        }
        try {
            // check that the value is JSON with relevant fields
            const json = JSON.parse(data);
            return (json && json.type === this.id && [1,2].includes(json.version));
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
                    if (json.version === 1) {
                        this.sign(json.payload, json.meta).then(signed => {
                            const message = new CoolMessage(json.type, json.version, signed, {/** TODO: maybe put a crc/hash of original unsigned in here? */});
                            resolve(message);
                        }, error => {
                            reject("Something wrong during signing: " + error);
                        });
                    } else if (json.version === 2) {
                        this.decrypt(json.payload.payload, json.payload.pubkey).then(decrypted => {
                            const message = new CoolMessage(json.type, json.version, decrypted, {chksum: json.payload.payload.substring(0,6)});
                            resolve(message);
                        });
                    } else {
                        reject("Unhandled data");
                    }
                } catch(e) {
                    reject("Can not handle.");
                }
            } else {
                reject("Can not handler null.");
            }
        });
    }

    public getId(): string {
        return this.id;
    }

    public sign(entity: any, meta: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                // Create a key pair object from private key
                const keys: any = this.getKeys();

                // Fix signer if empty => this publicKey
                if (!entity.signer) {
                    entity.signer = keys.keyPair.publicKey.toString();
                }
                // Encrypt message if not encrypted yet
                if (entity.message && entity.message.type === 2 && entity.message.publicKey) {
                    entity.message.payload = nem.crypto.helpers.encode(
                            nem.utils.helpers.fixPrivateKey(keys.privateKey),
                            entity.message.publicKey,
                            entity.message.payload
                        );
                }

                // Serialize the transaction
                const serialized: any = nem.utils.serialization.serializeTransaction(entity);

                // Sign the serialized transaction with keypair object
                const signature = keys.keyPair.sign(serialized);

                resolve(
                    {
                        'data': nem.utils.convert.ua2hex(serialized),
                        'signature': signature.toString()
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    public decrypt(payload: any, pubkey: any): Promise<any> {
        const keys = this.getKeys();
        return new Promise((resolve) => {
            resolve(nem.crypto.helpers.decode(keys.privateKey, pubkey ? pubkey : keys.keyPair.publicKey.toString(), payload));
        });
    }

    private getKeys(): any {
        // Get account private key for preparation or return
        const common: any = nem.model.objects.create('common')(this.selectedWallet[1], nem.utils.helpers.fixPrivateKey(''));
        common.password = this.selectedWallet[1];
        const primary: any = this.selectedWallet[0].accounts[0];
        if (!nem.crypto.helpers.passwordToPrivatekey(common,  this.selectedAccount, primary.algo)) {
            return undefined;
        }

        // Create a key pair object from private key
        const kp = nem.crypto.keyPair.create(nem.utils.helpers.fixPrivateKey(common.privateKey));
        return {
            keyPair: kp,
            privateKey: common.privateKey
        }
    }

    /**
     * Decode a base64 string to a wallet object
     *
     * @param base64 - A base64 string wallet
     *
     * @return - A wallet object
     */
    private base64Decode(base64: string) {
        // Wallet base 64 string to word array
        const wordArray: any = nem.crypto.js.enc.Base64.parse(base64);
        // Word array to JSON string
        return JSON.parse(wordArray.toString(nem.crypto.js.enc.Utf8));
    }
}
