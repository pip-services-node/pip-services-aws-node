"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let process = require('process');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_commons_node_4 = require("pip-services-commons-node");
const pip_services_container_node_1 = require("pip-services-container-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
class LambdaFunction extends pip_services_container_node_1.Container {
    constructor(name, description) {
        super(name, description);
        this._counters = new pip_services_components_node_2.CompositeCounters();
        this._dependencyResolver = new pip_services_commons_node_2.DependencyResolver();
        this._schemas = {};
        this._actions = {};
        this._configPath = './config/config.yaml';
        this._logger = new pip_services_components_node_1.ConsoleLogger();
    }
    getConfigPath() {
        return process.env.CONFIG_PATH || this._configPath;
    }
    getParameters() {
        let parameters = pip_services_commons_node_1.ConfigParams.fromValue(process.env);
        return parameters;
    }
    captureErrors(correlationId) {
        // Log uncaught exceptions
        process.on('uncaughtException', (ex) => {
            this._logger.fatal(correlationId, ex, "Process is terminated");
            process.exit(1);
        });
    }
    captureExit(correlationId) {
        this._logger.info(correlationId, "Press Control-C to stop the microservice...");
        // Activate graceful exit
        process.on('SIGINT', () => {
            process.exit();
        });
        // Gracefully shutdown
        process.on('exit', () => {
            this.close(correlationId);
            this._logger.info(correlationId, "Goodbye!");
        });
    }
    setReferences(references) {
        super.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this.register();
    }
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }
    run(callback) {
        let correlationId = this._info.name;
        let path = this.getConfigPath();
        let parameters = this.getParameters();
        this.readConfigFromFile(correlationId, path, parameters);
        this.captureErrors(correlationId);
        this.captureExit(correlationId);
        this.open(correlationId, callback);
    }
    registerAction(cmd, schema, action) {
        if (cmd == '')
            throw new pip_services_commons_node_3.UnknownException(null, 'NO_COMMAND', 'Missing command');
        if (action == null)
            throw new pip_services_commons_node_3.UnknownException(null, 'NO_ACTION', 'Missing action');
        if (!_.isFunction(action))
            throw new pip_services_commons_node_3.UnknownException(null, 'ACTION_NOT_FUNCTION', 'Action is not a function');
        // Hack!!! Wrapping action to preserve prototyping context
        let actionCurl = (params, callback) => {
            // Perform validation
            if (schema != null) {
                let correlationId = params.correlaton_id;
                let err = schema.validateAndReturnException(correlationId, params, false);
                if (err != null) {
                    callback(err, null);
                    return;
                }
            }
            // Todo: perform verification?
            action.call(this, params, callback);
        };
        this._actions[cmd] = actionCurl;
    }
    execute(event, context) {
        let cmd = event.cmd;
        let correlationId = event.correlation_id;
        if (cmd == null) {
            let err = new pip_services_commons_node_4.BadRequestException(correlationId, 'NO_COMMAND', 'Cmd parameter is missing');
            context.done(err, null);
            return;
        }
        let action = this._actions[cmd];
        if (action == null) {
            let err = new pip_services_commons_node_4.BadRequestException(correlationId, 'NO_ACTION', 'Action ' + cmd + ' was not found')
                .withDetails('command', cmd);
            context.done(err, null);
            return;
        }
        action(event, context.done);
    }
    handler(event, context) {
        // If already started then execute
        if (this.isOpen()) {
            this.execute(event, context);
        }
        // Start before execute
        else {
            this.run((err) => {
                if (err)
                    context.done(err, null);
                else
                    this.execute(event, context);
            });
        }
    }
    getHandler() {
        let self = this;
        // Return plugin function
        return function (event, context) {
            // Calling run with changed context
            return self.handler.call(self, event, context);
        };
    }
    // This method shall be used for testing
    act(params, callback) {
        let context = {
            done: callback
        };
        this.getHandler()(params, context);
    }
}
exports.LambdaFunction = LambdaFunction;
//# sourceMappingURL=LambdaFunction.js.map