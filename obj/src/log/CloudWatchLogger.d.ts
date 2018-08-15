import { IReferenceable, LogLevel } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { CachedLogger } from 'pip-services-commons-node';
import { LogMessage } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
export declare class CloudWatchLogger extends CachedLogger implements IReferenceable, IOpenable {
    private _timer;
    private _connectionResolver;
    private _client;
    private _connection;
    private _connectTimeout;
    private _group;
    private _stream;
    private _lastToken;
    private _logger;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    protected write(level: LogLevel, correlationId: string, ex: Error, message: string): void;
    isOpened(): boolean;
    open(correlationId: string, callback: (err: any) => void): void;
    close(correlationId: string, callback: (err: any) => void): void;
    private formatMessageText(message);
    protected save(messages: LogMessage[], callback: (err: any) => void): void;
}
