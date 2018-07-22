"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
class AwsConnectionParams extends pip_services_commons_node_1.ConfigParams {
    constructor(values = null) {
        super(values);
    }
    getPartition() {
        return super.getAsNullableString("partition") || "aws";
    }
    setPartition(value) {
        super.put("partition", value);
    }
    getService() {
        return super.getAsNullableString("service") || super.getAsNullableString("protocol");
    }
    setService(value) {
        super.put("service", value);
    }
    getRegion() {
        return super.getAsNullableString("region");
    }
    setRegion(value) {
        super.put("region", value);
    }
    getAccount() {
        return super.getAsNullableString("account");
    }
    setAccount(value) {
        super.put("account", value);
    }
    getResourceType() {
        return super.getAsNullableString("resource_type");
    }
    setResourceType(value) {
        super.put("resource_type", value);
    }
    getResource() {
        return super.getAsNullableString("resource");
    }
    setResource(value) {
        super.put("resource", value);
    }
    getArn() {
        let arn = super.getAsNullableString("arn");
        if (arn)
            return arn;
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
    setArn(value) {
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
            }
            else {
                let temp = tokens[5];
                let pos = temp.indexOf("/");
                if (pos > 0) {
                    this.setResourceType(temp.substring(0, pos));
                    this.setResource(temp.substring(pos + 1));
                }
                else {
                    this.setResourceType(null);
                    this.setResource(temp);
                }
            }
        }
    }
    getAccessId() {
        return super.getAsNullableString("access_id") || super.getAsNullableString("client_id");
    }
    setAccessId(value) {
        super.put("access_id", value);
    }
    getAccessKey() {
        return super.getAsNullableString("access_key") || super.getAsNullableString("client_key");
    }
    setAccessKey(value) {
        super.put("access_key", value);
    }
    static fromString(line) {
        let map = pip_services_commons_node_2.StringValueMap.fromString(line);
        return new AwsConnectionParams(map);
    }
    validate(correlationId) {
        let arn = this.getArn();
        if (arn == "arn:aws::::") {
            return new pip_services_commons_node_3.ConfigException(correlationId, "NO_AWS_CONNECTION", "AWS connection is not set");
        }
        if (this.getAccessId() == null) {
            return new pip_services_commons_node_3.ConfigException(correlationId, "NO_ACCESS_ID", "No access_id is configured in AWS credential");
        }
        if (this.getAccessKey() == null) {
            return new pip_services_commons_node_3.ConfigException(correlationId, "NO_ACCESS_KEY", "No access_key is configured in AWS credential");
        }
    }
    static fromConfig(config) {
        let result = new AwsConnectionParams();
        let credentials = pip_services_components_node_1.CredentialParams.manyFromConfig(config);
        for (let credential of credentials)
            result.append(credential);
        let connections = pip_services_components_node_2.ConnectionParams.manyFromConfig(config);
        for (let connection of connections)
            result.append(connection);
        return result;
    }
    static mergeConfigs(...configs) {
        let config = pip_services_commons_node_1.ConfigParams.mergeConfigs(...configs);
        return new AwsConnectionParams(config);
    }
}
exports.AwsConnectionParams = AwsConnectionParams;
//# sourceMappingURL=AwsConnectionParams.js.map