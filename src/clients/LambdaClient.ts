let _ = require('lodash');
let async = require('async');

import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { IdGenerator } from 'pip-services-commons-node';
import { UnknownException } from 'pip-services-commons-node';
import { InvocationException } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { Timing } from 'pip-services-components-node';

import { AwsConnectionParams } from '../connect/AwsConnectionParams';
import { AwsConnectionResolver } from '../connect/AwsConnectionResolver';

export abstract class LambdaClient implements IOpenable, IConfigurable, IReferenceable {
    protected _lambda: any;
    protected _opened: boolean = false;
    protected _connection: AwsConnectionParams;
    private _connectTimeout: number = 10000;

    protected _dependencyResolver: DependencyResolver = new DependencyResolver();
    protected _connectionResolver: AwsConnectionResolver = new AwsConnectionResolver();
    protected _logger: CompositeLogger = new CompositeLogger();
    protected _counters: CompositeCounters = new CompositeCounters();

    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
		this._dependencyResolver.configure(config);

        this._connectTimeout = config.getAsIntegerWithDefault('options.connect_timeout', this._connectTimeout);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }

    protected instrument(correlationId: string, name: string): Timing {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }

    public isOpen(): boolean {
        return this._opened;
    }

    public isOpened(): boolean {
        return this._opened;
    }

    public open(correlationId: string, callback: (err?: any) => void): void {
        if (this.isOpen()) {
            if (callback) callback();
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

    public close(correlationId: string, callback?: (err?: any) => void): void {
        // Todo: close listening?
        this._opened = false;
        if (callback) callback();
    }

    protected invoke(invocationType: string, cmd: string, correlationId: string, args: any,
        callback?: (err: any, result: any) => void): void {

        if (cmd == null) {
            let err = new UnknownException(null, 'NO_COMMAND', 'Missing Seneca pattern cmd');
            if (callback) callback(err, null);
            else this._logger.error(correlationId, err, 'Failed to call %s', cmd);
            return;
        }

        args = _.clone(args);
        args.cmd = cmd;
        args.correlation_id = correlationId || IdGenerator.nextShort();

        let params = {
            FunctionName: this._connection.getArn(),
            InvocationType: invocationType,
            LogType: 'None',
            Payload: JSON.stringify(args)
        }                        
                        
        this._lambda.invoke(params, (err, data) => {
            if (callback == null) {
                if (err) this._logger.error(correlationId, err, 'Failed to invoke lambda function');
                return;
            }
            
            if (err) {
                err = new InvocationException(
                    correlationId, 
                    'CALL_FAILED', 
                    'Failed to invoke lambda function'
                ).withCause(err);

                if (callback) callback(err, null);
            } else {
                let result: any = data.Payload;
                if (_.isString(result)) {
                    try {
                        result = JSON.parse(result);
                    } catch (err) {
                        err = new InvocationException(
                            correlationId,
                            'DESERIALIZATION_FAILED',
                            'Failed to deserialize result'
                        ).withCause(err);

                        callback(err, null);
                    }
                }
                callback(null, result);
            }
        });
    }    

    protected call(cmd: string, correlationId: string, params: any = {},
        callback?: (err: any, result: any) => void): void {
        this.invoke('RequestResponse', cmd, correlationId, params, callback);
    }

    protected callOneWay(cmd: string, correlationId: string, params: any = {},
        callback?: (err: any) => void): void {
        this.invoke('Event', cmd, correlationId, params, callback);
    }

}