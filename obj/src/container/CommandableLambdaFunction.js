"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const LambdaFunction_1 = require("./LambdaFunction");
class CommandableLambdaFunction extends LambdaFunction_1.LambdaFunction {
    constructor(name, description) {
        super(name, description);
        this._dependencyResolver.put('controller', 'none');
    }
    registerCommandSet(commandSet) {
        let commands = commandSet.getCommands();
        for (let index = 0; index < commands.length; index++) {
            let command = commands[index];
            this.registerAction(command.getName(), null, (params, callback) => {
                let correlationId = params.correlation_id;
                let args = pip_services_commons_node_1.Parameters.fromValue(params);
                let timing = this.instrument(correlationId, this._info.name + '.' + command.getName());
                command.execute(correlationId, args, (err, result) => {
                    timing.endTiming();
                    callback(err, result);
                });
            });
        }
    }
    register() {
        let controller = this._dependencyResolver.getOneRequired('controller');
        let commandSet = controller.getCommandSet();
        this.registerCommandSet(commandSet);
    }
}
exports.CommandableLambdaFunction = CommandableLambdaFunction;
//# sourceMappingURL=CommandableLambdaFunction.js.map