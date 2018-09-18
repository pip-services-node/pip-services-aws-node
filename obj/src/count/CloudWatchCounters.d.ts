import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { CachedCounters, Counter } from 'pip-services-components-node';
import { ConfigParams } from 'pip-services-commons-node';
export declare class CloudWatchCounters extends CachedCounters implements IReferenceable, IOpenable {
    private _logger;
    private _connectionResolver;
    private _connection;
    private _connectTimeout;
    private _client;
    private _source;
    private _instance;
    private _opened;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    isOpen(): boolean;
    open(correlationId: string, callback: (err: any) => void): void;
    close(correlationId: string, callback: (err: any) => void): void;
    private getCounterData;
    protected save(counters: Counter[]): void;
}
