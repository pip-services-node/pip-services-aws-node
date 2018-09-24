/** @module clients */
import { LambdaClient } from './LambdaClient';

/**
 * Abstract client that calls commandable AWS Lambda Functions.
 * 
 * Commandable services are generated automatically for ICommandable objects.
 * Each command is exposed as action determined by "cmd" parameter.
 * 
 * ### Configuration parameters ###
 * 
 * connections:                   
 *   discovery_key:               (optional) a key to retrieve the connection from IDiscovery
 *   region:                      (optional) AWS region
 * credentials:    
 *   store_key:                   (optional) a key to retrieve the credentials from ICredentialStore
 *   access_id:                   AWS access/client id
 *   access_key:                  AWS access/client id
 * options:
 *   connect_timeout:             (optional) connection timeout in milliseconds (default: 10 sec)
 *  
 * ### References ###
 * 
 * - *:logger:*:*:1.0               (optional) ILogger components to pass log messages
 * - *:counters:*:*:1.0             (optional) ICounters components to pass collected measurements
 * - *:discovery:*:*:1.0            (optional) IDiscovery services to resolve connection
 * - *:credential-store:*:*:1.0     (optional) Credential stores to resolve credentials
 * 
 * @see [[LambdaFunction]]
 * @see [[CommandableLambdaClient]]
 * 
 * ### Example ###
 * 
 * class MyLambdaClient extends CommandableLambdaClient implements IMyClient {
 *    ...
 * 
 *    public getData(correlationId: string, id: string, 
 *        callback: (err: any, result: MyData) => void): void {
 *        
 *        this.callCommand(
 *            "get_data",
 *            correlationId,
 *            { id: id },
 *            (err, result) => {
 *                callback(err, result);
 *            }
 *         );        
 *    }
 *    ...
 * }
 * 
 * let client = new MyLambdaClient();
 * client.configure(ConfigParams.fromTuples(
 *     "connection.region", "us-east-1",
 *     "connection.access_id", "XXXXXXXXXXX",
 *     "connection.access_key", "XXXXXXXXXXX",
 *     "connection.arn", "YYYYYYYYYYYYY"
 * ));
 * 
 * client.getData("123", "1", (err, result) => {
 *   ...
 * });
 */
export class CommandableLambdaClient extends LambdaClient {
    private _name: string;

    /**
     * Creates a new instance of this client.
     * 
     * @param name a service name.
     */
    public constructor(name: string) {
        super();
        this._name = name;
    }

    /**
     * Calls a remote action in AWS Lambda function.
     * The name of the action is added as "cmd" parameter
     * to the action parameters. 
     * 
     * @param cmd               an action name
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            command parameters.
     * @param callback          callback function that receives result or error.
     */
    public callCommand(cmd: string, correlationId: string, params: any,
        callback: (err: any, result: any) => void): void {
        
        let timing = this.instrument(correlationId, this._name + '.' + cmd);

        this.call(cmd, correlationId, params, (err, result) => {
            timing.endTiming();

            if (callback) callback(err, result);
        });
    }
}