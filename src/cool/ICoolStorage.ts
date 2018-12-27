export interface ICoolStorage {
    getId(): string;
    willHandle(data: any): boolean;
    handle(data: any): Promise<any>;

    sign(entity: any, meta: any): Promise<any>;
    decrypt(data: any, pubkey: any): Promise<any>;
}
