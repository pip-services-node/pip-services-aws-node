"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LambdaClient_1 = require("./LambdaClient");
class CommandableLambdaClient extends LambdaClient_1.LambdaClient {
    constructor(name) {
        super();
        this._name = name;
    }
    callCommand(cmd, correlationId, params, callback) {
        let timing = this.instrument(correlationId, this._name + '.' + cmd);
        this.call(cmd, correlationId, params, (err, result) => {
            timing.endTiming();
            if (callback)
                callback(err, result);
        });
    }
}
exports.CommandableLambdaClient = CommandableLambdaClient;
//# sourceMappingURL=CommandableLambdaClient.js.map