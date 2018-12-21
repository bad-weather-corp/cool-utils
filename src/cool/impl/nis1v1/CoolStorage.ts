import * as nemSdk from "nem-sdk";
const nem = nemSdk.default;
import { ICoolStorage } from '../../ICoolStorage';

export class CoolStorage implements ICoolStorage {
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

    public sign(entity: any, meta: any): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                // Get account private key for preparation or return
                const common: any = nem.model.objects.create('common')(self.selectedWallet[1], nem.utils.helpers.fixPrivateKey(''));
                common.password = self.selectedWallet[1];
                const primary: any = self.selectedWallet[0].accounts[0];
                if (!nem.crypto.helpers.passwordToPrivatekey(common,  self.selectedAccount, primary.algo)) {
                    return undefined;
                }

                // Create a key pair object from private key
                const kp: any = nem.crypto.keyPair.create(nem.utils.helpers.fixPrivateKey(common.privateKey));

                // Fix signer if empty => this publicKey
                if (!entity.signer) {
                    entity.signer = kp.publicKey.toString();
                }
                // Encrypt message if not encrypted yet
                if (entity.message && entity.message.type === 2 && entity.message.publicKey) {
                    entity.message.payload = nem.crypto.helpers.encode(
                            nem.utils.helpers.fixPrivateKey(common.privateKey),
                            entity.message.publicKey,
                            entity.message.payload
                        );
                }

                // Serialize the transaction
                const serialized: any = nem.utils.serialization.serializeTransaction(entity);

                // Sign the serialized transaction with keypair object
                const signature = kp.sign(serialized);

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
