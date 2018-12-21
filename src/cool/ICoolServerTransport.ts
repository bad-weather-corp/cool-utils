import { CoolMessage } from "./CoolMessage";

export interface ICoolServerTransport {
    handleRequest(): Promise<CoolMessage>;
    cleanup(): void;
}