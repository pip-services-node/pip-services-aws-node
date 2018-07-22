"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const AwsConnectionParams_1 = require("./AwsConnectionParams");
class AwsConnectionResolver {
    constructor() {
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
        this._credentialResolver = new pip_services_components_node_2.CredentialResolver();
    }
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    resolve(correlationId, callback) {
        let connection = new AwsConnectionParams_1.AwsConnectionParams();
        let credential = null;
        async.series([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err, data) => {
                    if (err == null && data != null)
                        connection.append(data);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err, data) => {
                    if (err == null && data != null)
                        connection.append(data);
                    callback(err);
                });
            },
            (callback) => {
                // Force ARN parsing
                connection.setArn(connection.getArn());
                // Perform validation
                let err = connection.validate(correlationId);
                callback(err);
            }
        ], (err) => {
            connection = err == null ? connection : null;
            callback(err, connection);
        });
    }
}
exports.AwsConnectionResolver = AwsConnectionResolver;
//# sourceMappingURL=AwsConnectionResolver.js.map