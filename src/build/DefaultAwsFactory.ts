import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';

import { CloudWatchLogger } from '../log/CloudWatchLogger';
import { CloudWatchCounters } from '../count/CloudWatchCounters';

export class DefaultAwsFactory extends Factory {
    public static readonly Descriptor = new Descriptor("pip-services", "factory", "aws", "default", "1.0");
    
	public static readonly CloudWatchLoggerDescriptor = new Descriptor("pip-services", "logger", "cloudwatch", "*", "1.0");
	public static readonly CloudWatchCountersDescriptor = new Descriptor("pip-services", "counters", "cloudwatch", "*", "1.0");
    
	public constructor() {
        super();
		this.registerAsType(DefaultAwsFactory.CloudWatchLoggerDescriptor, CloudWatchLogger);
		this.registerAsType(DefaultAwsFactory.CloudWatchCountersDescriptor, CloudWatchCounters);
	}
}