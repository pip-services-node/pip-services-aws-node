let async = require('async');

import { IReferenceable, CounterType } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { CachedCounters, Counter } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { AwsConnectionResolver } from '../connect';
import { AwsConnectionParams } from '../connect';
import { CompositeLogger } from 'pip-services-commons-node';
import { ContextInfo } from 'pip-services-commons-node';
import { Descriptor } from 'pip-services-commons-node';
import { CloudWatchUnit } from './CloudWatchUnit';

export class CloudWatchCounters extends CachedCounters implements IReferenceable, IOpenable {

    private _logger: CompositeLogger = new CompositeLogger();

    private _connectionResolver: AwsConnectionResolver = new AwsConnectionResolver();
    private _connection: AwsConnectionParams;
    private _connectTimeout: number = 30000;
    private _client: any = null; //AmazonCloudWatchClient

    private _source: string;
    private _instance: string;
    private _opened: boolean = false;

    public constructor() {
        super();
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._connectionResolver.configure(config);

        this._source = config.getAsStringWithDefault('soruce', this._source);
        this._instance = config.getAsStringWithDefault('group', this._instance);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);

        let contextInfo = references.getOneOptional<ContextInfo>(
            new Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._source == null)
            this._source = contextInfo.name;
        if (contextInfo != null && this._instance == null)
            this._instance = contextInfo.contextId;
    }

    public isOpened(): boolean {
        return this._opened;
    }

    public open(correlationId: string, callback: (err: any) => void): void {
        if (this._opened) {
            if (callback) callback(null);
            return;
        }

        this._opened = true;

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

                this._client = new aws.CloudWatch({ apiVersion: '2010-08-01' });

                callback();
            }
        ], callback);
    }

    public close(correlationId: string, callback: (err: any) => void): void {
        this._opened = false;
        this._client = null;

        if (callback) callback(null);
    }

    private getCounterData(counter: Counter, now: Date, dimensions: any[]): any {
        let value = {
            MetricName: counter.name,
            Timestamp: counter.time,
            Dimensions: dimensions,
            Unit: CloudWatchUnit.None,
        }

        switch (counter.type) {
            case CounterType.Increment:
                value['Value'] = counter.count;
                value.Unit = CloudWatchUnit.Count;
                break;
            case CounterType.Interval:
                value.Unit = CloudWatchUnit.Milliseconds;
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case CounterType.Statistics:
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case CounterType.LastValue:
                value['Value'] = counter.last;
                break;
            case CounterType.Timestamp:
                value['Value'] = counter.time.getTime();
                break;
        }

        return value;
    }

    protected save(counters: Counter[]): void {
        if (this._client == null) return;

        let dimensions = [];
        dimensions.push({
            Name: "InstanceID",
            Value: this._instance
        });

        let now = new Date();

        let data = [];
        counters.forEach(counter => {
            data.push(this.getCounterData(counter, now, dimensions))

            if (data.length >= 20) {
                async.series([
                    (callback) => {
                        this._client.putMetricData(params, function (err, data) {
                            if (err) {
                                if (this._logger) this._logger.error("cloudwatch_counters", err, "putMetricData error");
                            }
                            callback(err);
                        });
                    },
                    (callback) => {
                        data = [];
                        callback();
                    }]);
            }
        });

        var params = {
            MetricData: data,
            Namespace: this._source
        };

        if (data.length > 0) {
            this._client.putMetricData(params, function (err, data) {
                if (err) {
                    if (this._logger) this._logger.error("cloudwatch_counters", err, "putMetricData error");
                }
            });
        }
    }
}