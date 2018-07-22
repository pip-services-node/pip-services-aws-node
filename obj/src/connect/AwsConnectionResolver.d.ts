import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
import { AwsConnectionParams } from './AwsConnectionParams';
export declare class AwsConnectionResolver implements IConfigurable, IReferenceable {
    protected _connectionResolver: ConnectionResolver;
    protected _credentialResolver: CredentialResolver;
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    resolve(correlationId: string, callback: (err: any, connection: AwsConnectionParams) => void): void;
}
