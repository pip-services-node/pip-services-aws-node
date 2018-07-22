import { ICommandable } from 'pip-services-commons-node';
import { CommandSet } from 'pip-services-commons-node';
import { Parameters } from 'pip-services-commons-node';

import { LambdaFunction } from './LambdaFunction';

export abstract class CommandableLambdaFunction extends LambdaFunction {

    public constructor(name: string, description?: string) {
        super(name, description);
        this._dependencyResolver.put('controller', 'none');
    }

    private registerCommandSet(commandSet: CommandSet) {
        let commands = commandSet.getCommands();
        for (let index = 0; index < commands.length; index++) {
            let command = commands[index];

            this.registerAction(command.getName(), null, (params, callback) => {
                let correlationId = params.correlation_id;
                let args = Parameters.fromValue(params);
                let timing = this.instrument(correlationId, this._info.name + '.' + command.getName());

                command.execute(correlationId, args, (err, result) => {
                    timing.endTiming();
                    callback(err, result);
                })
            });
        }
    }

    public register(): void {
        let controller: ICommandable = this._dependencyResolver.getOneRequired<ICommandable>('controller');
        let commandSet = controller.getCommandSet();
        this.registerCommandSet(commandSet);
    }
}
