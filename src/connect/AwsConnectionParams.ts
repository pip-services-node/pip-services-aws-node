import { ConfigParams } from 'pip-services-commons-node';
import { StringValueMap } from 'pip-services-commons-node';
import { ConfigException } from 'pip-services-commons-node';
import { CredentialParams } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';

export class AwsConnectionParams extends ConfigParams {

    public constructor(values: any = null) {
        super(values);
    }

    public getPartition(): string {
        return super.getAsNullableString("partition") || "aws";
    }

    public setPartition(value: string) {
        super.put("partition", value);
    }

    public getService(): string {
        return super.getAsNullableString("service") || super.getAsNullableString("protocol");
    }

    public setService(value: string) {
        super.put("service", value);
    }

    public getRegion(): string {
        return super.getAsNullableString("region");
    }

    public setRegion(value: string) {
        super.put("region", value);
    }

    public getAccount(): string {
        return super.getAsNullableString("account");
    }

    public setAccount(value: string) {
        super.put("account", value);
    }

    public getResourceType(): string {
        return super.getAsNullableString("resource_type");
    }

    public setResourceType(value: string) {
        super.put("resource_type", value);
    }

    public getResource(): string {
        return super.getAsNullableString("resource");
    }

    public setResource(value: string) {
        super.put("resource", value);
    }

    public getArn(): string {
        let arn = super.getAsNullableString("arn");
        if (arn) return arn;

        arn = "arn";
        let partition = this.getPartition() || "aws";
        arn += ":" + partition;
        let service = this.getService() || "";
        arn += ":" + service;
        let region = this.getRegion() || "";
        arn += ":" + region;
        let account = this.getAccount() || "";
        arn += ":" + account;
        let resourceType = this.getResourceType() || "";
        if (resourceType != "")
            arn += ":" + resourceType;
        let resource = this.getResource() || "";
        arn += ":" + resource;

        return arn;
    }

    public setArn(value: string) {
        super.put("arn", value);

        if (value != null) {
            let tokens = value.split(":");
            this.setPartition(tokens[1]);
            this.setService(tokens[2]);
            this.setRegion(tokens[3]);
            this.setAccount(tokens[4]);
            if (tokens.length > 6) {
                this.setResourceType(tokens[5]);
                this.setResource(tokens[6]);
            } else {
                let temp = tokens[5];
                let pos = temp.indexOf("/");
                if (pos > 0) {
                    this.setResourceType(temp.substring(0, pos));
                    this.setResource(temp.substring(pos + 1));
                } else {
                    this.setResourceType(null);
                    this.setResource(temp);
                }
            }
        }
    }

    public getAccessId(): string {
        return super.getAsNullableString("access_id") || super.getAsNullableString("client_id");
    }

    public setAccessId(value: string) {
        super.put("access_id", value);
    }

    public getAccessKey(): string {
        return super.getAsNullableString("access_key") || super.getAsNullableString("client_key");
    }

    public setAccessKey(value: string) {
        super.put("access_key", value);
    }

    public static fromString(line: string): AwsConnectionParams {
        let map = StringValueMap.fromString(line);
        return new AwsConnectionParams(map);
    }

    public validate(correlationId: string): ConfigException {
        let arn = this.getArn();
        if (arn == "arn:aws::::") {
            return new ConfigException(
                correlationId, 
                "NO_AWS_CONNECTION",
                "AWS connection is not set"
            );
        }

        if (this.getAccessId() == null) {
            return new ConfigException(
                correlationId,
                "NO_ACCESS_ID",
                "No access_id is configured in AWS credential"
            );
        }

        if (this.getAccessKey() == null) {
            return new ConfigException(
                correlationId, 
                "NO_ACCESS_KEY", 
                "No access_key is configured in AWS credential"
            );
        }
    }

    public static fromConfig(config: ConfigParams): AwsConnectionParams {
        let result = new AwsConnectionParams();

        let credentials = CredentialParams.manyFromConfig(config);
        for (let credential of credentials)
            result.append(credential);

        let connections = ConnectionParams.manyFromConfig(config);
        for (let connection of connections)
            result.append(connection);

        return result;
    }

    public static mergeConfigs(...configs: ConfigParams[]): AwsConnectionParams {
        let config = ConfigParams.mergeConfigs(...configs);
        return new AwsConnectionParams(config);
    }
}