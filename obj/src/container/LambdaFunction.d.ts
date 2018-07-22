import { IReferences } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { Schema } from 'pip-services-commons-node';
import { Container } from 'pip-services-container-node';
import { Timing } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
export declare abstract class LambdaFunction extends Container {
    protected _counters: CompositeCounters;
    protected _dependencyResolver: DependencyResolver;
    protected _schemas: {
        [id: string]: Schema;
    };
    protected _actions: {
        [id: string]: any;
    };
    protected _configPath: string;
    constructor(name?: string, description?: string);
    private getConfigPath;
    private getParameters;
    private captureErrors;
    private captureExit;
    setReferences(references: IReferences): void;
    protected instrument(correlationId: string, name: string): Timing;
    run(callback?: (err: any) => void): void;
    protected abstract register(): void;
    protected registerAction(cmd: string, schema: Schema, action: (params: any, callback: (err: any, result: any) => void) => void): void;
    private execute;
    private handler;
    getHandler(): (event: any, context: any) => void;
    act(params: any, callback: (err: any, result: any) => void): void;
}
