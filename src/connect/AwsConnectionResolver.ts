let _ = require('lodash');
let async = require('async');

import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';

import { AwsConnectionParams } from './AwsConnectionParams';

export class AwsConnectionResolver implements IConfigurable, IReferenceable {
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();
    protected _credentialResolver: CredentialResolver = new CredentialResolver();

    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }

    public resolve(correlationId: string,
        callback: (err: any, connection: AwsConnectionParams) => void): void {
        let connection = new AwsConnectionParams();
        let credential = null;

        async.series([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err: any, data: ConnectionParams) => {
                    if (err == null && data != null)
                        connection.append(data);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err: any, data: CredentialParams) => {
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