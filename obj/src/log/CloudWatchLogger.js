"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let async = require('async');
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
const connect_1 = require("../connect");
const pip_services_components_node_2 = require("pip-services-components-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
class CloudWatchLogger extends pip_services_components_node_1.CachedLogger {
    constructor() {
        super();
        this._connectionResolver = new connect_1.AwsConnectionResolver();
        this._client = null; //AmazonCloudWatchLogsClient
        this._connectTimeout = 30000;
        this._group = "undefined";
        this._stream = null;
        this._lastToken = null;
        this._logger = new pip_services_components_node_2.CompositeLogger();
    }
    configure(config) {
        super.configure(config);
        this._connectionResolver.configure(config);
        this._group = config.getAsStringWithDefault('group', this._group);
        this._stream = config.getAsStringWithDefault('stream', this._stream);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }
    setReferences(references) {
        super.setReferences(references);
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        let contextInfo = references.getOneOptional(new pip_services_commons_node_2.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._stream == null)
            this._stream = contextInfo.name;
        if (contextInfo != null && this._group == null)
            this._group = contextInfo.contextId;
    }
    write(level, correlationId, ex, message) {
        if (this._level < level) {
            return;
        }
        super.write(level, correlationId, ex, message);
    }
    isOpen() {
        return this._timer != null;
    }
    open(correlationId, callback) {
        if (this.isOpen()) {
            callback(null);
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
                this._client = new aws.CloudWatchLogs({ apiVersion: '2014-03-28' });
                let params = {
                    logGroupName: this._group
                };
                this._client.createLogGroup(params, (err, data) => {
                    if (err && err.code != "ResourceAlreadyExistsException") {
                        callback(err);
                    }
                    else {
                        callback();
                    }
                });
            },
            (callback) => {
                let paramsStream = {
                    logGroupName: this._group,
                    logStreamName: this._stream
                };
                this._client.createLogStream(paramsStream, (err, data) => {
                    if (err) {
                        if (err.code == "ResourceAlreadyExistsException") {
                            var params = {
                                logGroupName: this._group,
                                logStreamNamePrefix: this._stream,
                            };
                            this._client.describeLogStreams(params, (err, data) => {
                                if (data.logStreams.length > 0) {
                                    this._lastToken = data.logStreams[0].uploadSequenceToken;
                                }
                                callback(err);
                            });
                        }
                        else {
                            callback(err);
                        }
                    }
                    else {
                        this._lastToken = null;
                        callback(err);
                    }
                });
            },
            (callback) => {
                if (this._timer == null) {
                    this._timer = setInterval(() => { this.dump(); }, this._interval);
                }
                callback();
            }
        ], callback);
    }
    close(correlationId, callback) {
        this.save(this._cache, (err) => {
            if (this._timer)
                clearInterval(this._timer);
            this._cache = [];
            this._timer = null;
            this._client = null;
            if (callback)
                callback(null);
        });
    }
    formatMessageText(message) {
        let result = "";
        result += "[" + (message.source ? message.source : "---") + ":" +
            (message.correlation_id ? message.correlation_id : "---") + ":" + message.level + "] " +
            message.message;
        if (message.error != null) {
            if (!message.message) {
                result += "Error: ";
            }
            else {
                result += ": ";
            }
            result += message.error.message;
            if (message.error.stack_trace) {
                result += " StackTrace: " + message.error.stack_trace;
            }
        }
        return result;
    }
    save(messages, callback) {
        if (!this.isOpen() || messages == null || messages.length == 0) {
            if (callback)
                callback(null);
            return;
        }
        if (this._client == null) {
            let err = new pip_services_commons_node_1.ConfigException("cloudwatch_logger", 'NOT_OPENED', 'CloudWatchLogger is not opened');
            if (err != null) {
                callback(err);
                return;
            }
        }
        let events = [];
        messages.forEach(message => {
            events.push({
                timestamp: message.time.getTime(),
                message: this.formatMessageText(message)
            });
        });
        let params = {
            logEvents: events,
            logGroupName: this._group,
            logStreamName: this._stream,
            sequenceToken: this._lastToken
        };
        this._client.putLogEvents(params, (err, data) => {
            if (err) {
                if (this._logger)
                    this._logger.error("cloudwatch_logger", err, "putLogEvents error");
            }
            else {
                this._lastToken = data.nextSequenceToken;
            }
        });
    }
}
exports.CloudWatchLogger = CloudWatchLogger;
//# sourceMappingURL=CloudWatchLogger.js.map