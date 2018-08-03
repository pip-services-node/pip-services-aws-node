"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_commons_node_4 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const AwsConnectionResolver_1 = require("../connect/AwsConnectionResolver");
class LambdaClient {
    constructor() {
        this._opened = false;
        this._connectTimeout = 10000;
        this._dependencyResolver = new pip_services_commons_node_4.DependencyResolver();
        this._connectionResolver = new AwsConnectionResolver_1.AwsConnectionResolver();
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
    }
    configure(config) {
        this._connectionResolver.configure(config);
        this._dependencyResolver.configure(config);
        this._connectTimeout = config.getAsIntegerWithDefault('options.connect_timeout', this._connectTimeout);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }
    isOpen() {
        return this._opened;
    }
    open(correlationId, callback) {
        if (this.isOpen()) {
            if (callback)
                callback();
            return;
        }
        async.series([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err, connection) => {
                    this._connection = connection;
                    callback(err);
                });
            },
            (callback) => {
                let aws = require('aws-sdk');
                aws.config.update({
                    accessKeyId: this._connection.getAccessId(),
                    secretAccessKey: this._connection.getAccessKey(),
                    region: this._connection.getRegion()
                });
                aws.config.httpOptions = {
                    timeout: this._connectTimeout
                };
                this._lambda = new aws.Lambda();
                this._opened = true;
                this._logger.debug(correlationId, "Lambda client connected to %s", this._connection.getArn());
                callback();
            }
        ], callback);
    }
    close(correlationId, callback) {
        // Todo: close listening?
        this._opened = false;
        if (callback)
            callback();
    }
    invoke(invocationType, cmd, correlationId, args, callback) {
        if (cmd == null) {
            let err = new pip_services_commons_node_2.UnknownException(null, 'NO_COMMAND', 'Missing Seneca pattern cmd');
            if (callback)
                callback(err, null);
            else
                this._logger.error(correlationId, err, 'Failed to call %s', cmd);
            return;
        }
        args = _.clone(args);
        args.cmd = cmd;
        args.correlation_id = correlationId || pip_services_commons_node_1.IdGenerator.nextShort();
        let params = {
            FunctionName: this._connection.getArn(),
            InvocationType: invocationType,
            LogType: 'None',
            Payload: JSON.stringify(args)
        };
        this._lambda.invoke(params, (err, data) => {
            if (callback == null) {
                if (err)
                    this._logger.error(correlationId, err, 'Failed to invoke lambda function');
                return;
            }
            if (err) {
                err = new pip_services_commons_node_3.InvocationException(correlationId, 'CALL_FAILED', 'Failed to invoke lambda function').withCause(err);
                if (callback)
                    callback(err, null);
            }
            else {
                let result = data.Payload;
                if (_.isString(result)) {
                    try {
                        result = JSON.parse(result);
                    }
                    catch (err) {
                        err = new pip_services_commons_node_3.InvocationException(correlationId, 'DESERIALIZATION_FAILED', 'Failed to deserialize result').withCause(err);
                        callback(err, null);
                    }
                }
                callback(null, result);
            }
        });
    }
    call(cmd, correlationId, params = {}, callback) {
        this.invoke('RequestResponse', cmd, correlationId, params, callback);
    }
    callOneWay(cmd, correlationId, params = {}, callback) {
        this.invoke('Event', cmd, correlationId, params, callback);
    }
}
exports.LambdaClient = LambdaClient;
//# sourceMappingURL=LambdaClient.js.map