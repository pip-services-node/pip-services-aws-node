import { LambdaFunction } from './LambdaFunction';
export declare abstract class CommandableLambdaFunction extends LambdaFunction {
    constructor(name: string, description?: string);
    private registerCommandSet(commandSet);
    register(): void;
}
