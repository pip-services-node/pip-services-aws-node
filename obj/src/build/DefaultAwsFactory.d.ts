import { Factory } from 'pip-services-commons-node';
import { Descriptor } from 'pip-services-commons-node';
export declare class DefaultAwsFactory extends Factory {
    static readonly Descriptor: Descriptor;
    static readonly CloudWatchLoggerDescriptor: Descriptor;
    static readonly CloudWatchCountersDescriptor: Descriptor;
    constructor();
}
