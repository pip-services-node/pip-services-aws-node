let _ = require('lodash');
let process = require('process');

import { ConfigParams } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { Schema } from 'pip-services-commons-node';
import { UnknownException } from 'pip-services-commons-node';
import { BadRequestException } from 'pip-services-commons-node';
import { Container } from 'pip-services-container-node';
import { Timing } from 'pip-services-components-node';
import { ConsoleLogger } from 'pip-services-commons-node';
import { CompositeCounters } from 'pip-services-components-node';

export abstract class LambdaFunction extends Container {
    protected _counters = new CompositeCounters();
    protected _dependencyResolver = new DependencyResolver();
    protected _schemas: { [id: string]: Schema } = {};
    protected _actions: { [id: string]: any } = {};
    protected _configPath: string = './config/config.yaml';

    public constructor(name?: string, description?: string) {
        super(name, description);

        this._logger = new ConsoleLogger();
    }

    private getConfigPath(): string {
        return process.env.CONFIG_PATH || this._configPath;
    }

    private getParameters(): ConfigParams {
        let parameters = ConfigParams.fromValue(process.env);
        return parameters;
    }

    private captureErrors(correlationId: string): void {
        // Log uncaught exceptions
        process.on('uncaughtException', (ex) => {
            this._logger.fatal(correlationId, ex, "Process is terminated");
            process.exit(1);
        });
    }

    private captureExit(correlationId: string): void {
        this._logger.info(correlationId, "Press Control-C to stop the microservice...");

        // Activate graceful exit
        process.on('SIGINT', () => {
            process.exit();
        });

        // Gracefully shutdown
        process.on('exit', () => {
            this.close(correlationId);
            this._logger.info(correlationId, "Goodbye!");
        });
    }

    public setReferences(references: IReferences): void {
        super.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);

        this.register();
    }

    protected instrument(correlationId: string, name: string): Timing {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }

    public run(callback?: (err: any) => void): void {
        let correlationId = this._info.name;

        let path = this.getConfigPath();
        let parameters = this.getParameters();
        this.readConfigFromFile(correlationId, path, parameters);

        this.captureErrors(correlationId);
        this.captureExit(correlationId);
    	this.open(correlationId, callback);
    }

    protected abstract register(): void;

    protected registerAction(cmd: string, schema: Schema, 
        action: (params: any, callback: (err: any, result: any) => void) => void): void {
        if (cmd == '')
            throw new UnknownException(null, 'NO_COMMAND', 'Missing command');

        if (action == null)
            throw new UnknownException(null, 'NO_ACTION', 'Missing action');

        if (!_.isFunction(action))
            throw new UnknownException(null, 'ACTION_NOT_FUNCTION', 'Action is not a function');

        // Hack!!! Wrapping action to preserve prototyping context
        let actionCurl = (params, callback) => { 
            // Perform validation
            if (schema != null) {
                let correlationId = params.correlaton_id;
                let err = schema.validateAndReturnException(correlationId, params, false);
                if (err != null) {
                    callback(err, null);
                    return;
                }
            }

            // Todo: perform verification?
            action.call(this, params, callback); 
        };

        this._actions[cmd] = actionCurl;
    }

    private execute(event: any, context: any) {
        let cmd: string = event.cmd;
        let correlationId = event.correlation_id;
        
        if (cmd == null) {
            let err = new BadRequestException(
                correlationId, 
                'NO_COMMAND', 
                'Cmd parameter is missing'
            );

            context.done(err, null);
            return;
        }
        
        let action: any = this._actions[cmd];
        if (action == null) {
            let err = new BadRequestException(
                correlationId, 
                'NO_ACTION', 
                'Action ' + cmd + ' was not found'
            )
            .withDetails('command', cmd);

            context.done(err, null);
            return;
        }
        
        action(event, context.done);
    }
    
    private handler(event: any, context: any) {
        // If already started then execute
        if (this.isOpen()) {
            this.execute(event, context);
        }
        // Start before execute
        else {
            this.run((err) => {
                if (err) context.done(err, null);
                else this.execute(event, context);
            });
        }
    }
    
    public getHandler(): (event: any, context: any) => void {
        let self = this;
        
        // Return plugin function
        return function (event, context) {
            // Calling run with changed context
            return self.handler.call(self, event, context);
        }
    }

    // This method shall be used for testing
    public act(params: any, callback: (err: any, result: any) => void): void {
        let context = {
            done: callback
        };
        this.getHandler()(params, context);
    }

}