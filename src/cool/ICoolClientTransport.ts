import { CoolMessage } from "./CoolMessage";

export interface ICoolClientTransport {
    request(message: CoolMessage): Promise<CoolMessage>;
    cleanup(): void;
}

