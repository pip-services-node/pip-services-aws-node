let async = require('async');

import { IReferenceable } from 'pip-services-commons-node';
import { LogLevel } from 'pip-services-components-node';
import { IReferences } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { CachedLogger } from 'pip-services-components-node';
import { LogMessage } from 'pip-services-components-node';
import { ConfigException } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { AwsConnectionResolver } from '../connect';
import { AwsConnectionParams } from '../connect';
import { CompositeLogger } from 'pip-services-components-node';
import { ContextInfo } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node'

export class CloudWatchLogger extends CachedLogger implements IReferenceable, IOpenable {

    private _timer: any;

    private _connectionResolver: AwsConnectionResolver = new AwsConnectionResolver();
    private _client: any = null; //AmazonCloudWatchLogsClient
    private _connection: AwsConnectionParams;
    private _connectTimeout: number = 30000;

    private _group: string = "undefined";
    private _stream: string = null;
    private _lastToken: string = null;

    private _logger: CompositeLogger = new CompositeLogger();

    public constructor() {
        super();
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._connectionResolver.configure(config);

        this._group = config.getAsStringWithDefault('group', this._group);
        this._stream = config.getAsStringWithDefault('stream', this._stream);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }

    public setReferences(references: IReferences): void {
        super.setReferences(references);
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);

        let contextInfo = references.getOneOptional<ContextInfo>(
            new Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._stream == null)
            this._stream = contextInfo.name;
        if (contextInfo != null && this._group == null)
            this._group = contextInfo.contextId;
    }

    protected write(level: LogLevel, correlationId: string, ex: Error, message: string): void {
        if (this._level < level) {
            return;
        }

        super.write(level, correlationId, ex, message);
    }

    public isOpen(): boolean {
        return this._timer != null;
    }

    public open(correlationId: string, callback: (err: any) => void): void {
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
                                callback(err)
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
                    this._timer = setInterval(() => { this.dump() }, this._interval);
                }

                callback();
            }
        ], callback);

    }

    public close(correlationId: string, callback: (err: any) => void): void {
        this.save(this._cache, (err) => {
            if (this._timer)
                clearInterval(this._timer);

            this._cache = [];
            this._timer = null;
            this._client = null;

            if (callback) callback(null);
        });
    }

    private formatMessageText(message: LogMessage): string {
        let result: string = "";
        result += "[" + (message.source ? message.source : "---") + ":" +
            (message.correlation_id ? message.correlation_id : "---") + ":" + message.level + "] " +
            message.message;
        if (message.error != null) {
            if (!message.message) {
                result += "Error: ";
            } else {
                result += ": ";
            }

            result += message.error.message;

            if (message.error.stack_trace) {
                result += " StackTrace: " + message.error.stack_trace;
            }
        }

        return result;
    }

    protected save(messages: LogMessage[], callback: (err: any) => void): void {
        if (!this.isOpen() || messages == null || messages.length == 0) {
            if (callback) callback(null);
            return;
        }

        if (this._client == null) {
            let err = new ConfigException("cloudwatch_logger", 'NOT_OPENED', 'CloudWatchLogger is not opened');

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
                if (this._logger) this._logger.error("cloudwatch_logger", err, "putLogEvents error");
            } else {
                this._lastToken = data.nextSequenceToken;
            }
        });
    }
}