"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
const CloudWatchLogger_1 = require("../log/CloudWatchLogger");
const CloudWatchCounters_1 = require("../count/CloudWatchCounters");
class DefaultAwsFactory extends pip_services_components_node_1.Factory {
    constructor() {
        super();
        this.registerAsType(DefaultAwsFactory.CloudWatchLoggerDescriptor, CloudWatchLogger_1.CloudWatchLogger);
        this.registerAsType(DefaultAwsFactory.CloudWatchCountersDescriptor, CloudWatchCounters_1.CloudWatchCounters);
    }
}
DefaultAwsFactory.Descriptor = new pip_services_commons_node_1.Descriptor("pip-services", "factory", "aws", "default", "1.0");
DefaultAwsFactory.CloudWatchLoggerDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "logger", "cloudwatch", "*", "1.0");
DefaultAwsFactory.CloudWatchCountersDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "counters", "cloudwatch", "*", "1.0");
exports.DefaultAwsFactory = DefaultAwsFactory;
//# sourceMappingURL=DefaultAwsFactory.js.map