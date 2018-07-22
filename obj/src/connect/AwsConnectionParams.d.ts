import { ConfigParams } from 'pip-services-commons-node';
import { ConfigException } from 'pip-services-commons-node';
export declare class AwsConnectionParams extends ConfigParams {
    constructor(values?: any);
    getPartition(): string;
    setPartition(value: string): void;
    getService(): string;
    setService(value: string): void;
    getRegion(): string;
    setRegion(value: string): void;
    getAccount(): string;
    setAccount(value: string): void;
    getResourceType(): string;
    setResourceType(value: string): void;
    getResource(): string;
    setResource(value: string): void;
    getArn(): string;
    setArn(value: string): void;
    getAccessId(): string;
    setAccessId(value: string): void;
    getAccessKey(): string;
    setAccessKey(value: string): void;
    static fromString(line: string): AwsConnectionParams;
    validate(correlationId: string): ConfigException;
    static fromConfig(config: ConfigParams): AwsConnectionParams;
    static mergeConfigs(...configs: ConfigParams[]): AwsConnectionParams;
}
