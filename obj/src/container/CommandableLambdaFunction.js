"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const LambdaFunction_1 = require("./LambdaFunction");
/**
 * Abstract AWS Lambda function, that acts as a container to instantiate and run components
 * and expose them via external entry point. All actions are automatically generated for commands
 * defined in ICommandable components. Each command is exposed as an action defined by "cmd" parameter.
 *
 * Container configuration for this Lambda function is stored in "./config/config.yml" file.
 * But this path can be overriden by CONFIG_PATH environment variable.
 *
 * ### Configuration parameters ###
 *
 * dependencies:
 *   controller:                  override for Controller dependency
 * connections:
 *   discovery_key:               (optional) a key to retrieve the connection from IDiscovery
 *   region:                      (optional) AWS region
 * credentials:
 *   store_key:                   (optional) a key to retrieve the credentials from ICredentialStore
 *   access_id:                   AWS access/client id
 *   access_key:                  AWS access/client id
 *
 * ### References ###
 *
 * - *:logger:*:*:1.0               (optional) ILogger components to pass log messages
 * - *:counters:*:*:1.0             (optional) ICounters components to pass collected measurements
 * - *:discovery:*:*:1.0            (optional) IDiscovery services to resolve connection
 * - *:credential-store:*:*:1.0     (optional) Credential stores to resolve credentials
 *
 * @see [[LambdaClient]]
 *
 * ### Example ###
 *
 * class MyLambdaFunction extends CommandableLambdaFunction {
 *    private _controller: IMyController;
 *    ...
 *    public constructor() {
 *       base("mygroup", "MyGroup lambda function");
 *       this._dependencyResolver.put(
 *           "controller",
 *           new Descriptor("mygroup","controller","*","*","1.0")
 *       );
 *    }
 * }
 *
 * let lambda = new MyLambdaFunction();
 *
 * service.run((err) => {
 *    console.log("MyLambdaFunction is started");
 * });
 */
class CommandableLambdaFunction extends LambdaFunction_1.LambdaFunction {
    /**
     * Creates a new instance of this lambda function.
     *
     * @param name          (optional) a container name (accessible via ContextInfo)
     * @param description   (optional) a container description (accessible via ContextInfo)
     */
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
    /**
     * Registers all actions in this lambda function.
     */
    register() {
        let controller = this._dependencyResolver.getOneRequired('controller');
        let commandSet = controller.getCommandSet();
        this.registerCommandSet(commandSet);
    }
}
exports.CommandableLambdaFunction = CommandableLambdaFunction;
//# sourceMappingURL=CommandableLambdaFunction.js.map