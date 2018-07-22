import { LambdaClient } from './LambdaClient';

export class CommandableLambdaClient extends LambdaClient {
    private _name: string;

    public constructor(name: string) {
        super();
        this._name = name;
    }

    public callCommand(cmd: string, correlationId: string, params: any, callback: (err: any, result: any) => void): void {
        let timing = this.instrument(correlationId, this._name + '.' + cmd);

        this.call(cmd, correlationId, params, (err, result) => {
            timing.endTiming();

            if (callback) callback(err, result);
        });
    }
}