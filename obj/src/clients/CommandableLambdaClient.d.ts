import { LambdaClient } from './LambdaClient';
export declare class CommandableLambdaClient extends LambdaClient {
    private _name;
    constructor(name: string);
    callCommand(cmd: string, correlationId: string, params: any, callback: (err: any, result: any) => void): void;
}
