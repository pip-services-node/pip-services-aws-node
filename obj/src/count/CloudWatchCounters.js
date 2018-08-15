"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const connect_1 = require("../connect");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_commons_node_4 = require("pip-services-commons-node");
const CloudWatchUnit_1 = require("./CloudWatchUnit");
class CloudWatchCounters extends pip_services_commons_node_2.CachedCounters {
    constructor() {
        super();
        this._logger = new pip_services_commons_node_3.CompositeLogger();
        this._connectionResolver = new connect_1.AwsConnectionResolver();
        this._connectTimeout = 30000;
        this._client = null; //AmazonCloudWatchClient
        this._opened = false;
    }
    configure(config) {
        super.configure(config);
        this._connectionResolver.configure(config);
        this._source = config.getAsStringWithDefault('soruce', this._source);
        this._instance = config.getAsStringWithDefault('group', this._instance);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        let contextInfo = references.getOneOptional(new pip_services_commons_node_4.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._source == null)
            this._source = contextInfo.name;
        if (contextInfo != null && this._instance == null)
            this._instance = contextInfo.contextId;
    }
    isOpened() {
        return this._opened;
    }
    open(correlationId, callback) {
        if (this._opened) {
            if (callback)
                callback(null);
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
    close(correlationId, callback) {
        this._opened = false;
        this._client = null;
        if (callback)
            callback(null);
    }
    getCounterData(counter, now, dimensions) {
        let value = {
            MetricName: counter.name,
            Timestamp: counter.time,
            Dimensions: dimensions,
            Unit: CloudWatchUnit_1.CloudWatchUnit.None,
        };
        switch (counter.type) {
            case pip_services_commons_node_1.CounterType.Increment:
                value['Value'] = counter.count;
                value.Unit = CloudWatchUnit_1.CloudWatchUnit.Count;
                break;
            case pip_services_commons_node_1.CounterType.Interval:
                value.Unit = CloudWatchUnit_1.CloudWatchUnit.Milliseconds;
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case pip_services_commons_node_1.CounterType.Statistics:
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case pip_services_commons_node_1.CounterType.LastValue:
                value['Value'] = counter.last;
                break;
            case pip_services_commons_node_1.CounterType.Timestamp:
                value['Value'] = counter.time.getTime();
                break;
        }
        return value;
    }
    save(counters) {
        if (this._client == null)
            return;
        let dimensions = [];
        dimensions.push({
            Name: "InstanceID",
            Value: this._instance
        });
        let now = new Date();
        let data = [];
        counters.forEach(counter => {
            data.push(this.getCounterData(counter, now, dimensions));
            if (data.length >= 20) {
                async.series([
                    (callback) => {
                        this._client.putMetricData(params, function (err, data) {
                            if (err) {
                                console.log("put error: ", err);
                                if (this._logger)
                                    this._logger.error("cloudwatch_counters", err, "putMetricData error");
                            }
                            callback(err);
                        });
                    },
                    (callback) => {
                        data = [];
                        callback();
                    }
                ]);
            }
        });
        var params = {
            MetricData: data,
            Namespace: this._source
        };
        if (data.length > 0) {
            this._client.putMetricData(params, function (err, data) {
                if (err) {
                    console.log("put error: ", err);
                    if (this._logger)
                        this._logger.error("cloudwatch_counters", err, "putMetricData error");
                }
            });
        }
    }
}
exports.CloudWatchCounters = CloudWatchCounters;
//# sourceMappingURL=CloudWatchCounters.js.map