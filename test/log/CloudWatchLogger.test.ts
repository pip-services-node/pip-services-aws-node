import { ConfigParams } from 'pip-services-commons-node';

import { CloudWatchLogger } from '../../src/log/CloudWatchLogger';
import { LoggerFixture } from './LoggerFixture';

suite('CloudWatchLogger', ()=> {
    let _logger: CloudWatchLogger;
    let _fixture: LoggerFixture;

    let AWS_REGION = process.env["AWS_REGION"] || "";
    let AWS_ACCESS_ID = process.env["AWS_ACCESS_ID"] || "";
    let AWS_ACCESS_KEY = process.env["AWS_ACCESS_KEY"] || "";

    if (AWS_ACCESS_ID == "" || AWS_ACCESS_KEY == "")
        return;

    setup((done) => {

        _logger = new CloudWatchLogger();
        _fixture = new LoggerFixture(_logger);

        let config = ConfigParams.fromTuples(
            "group", "TestGroup",
            "stream", "TestStream",
            "connection.region", AWS_REGION,
            "credential.access_id", AWS_ACCESS_ID,
            "credential.access_key", AWS_ACCESS_KEY
        );
        _logger.configure(config);

        _logger.open(null, (err) => {
             done(err);
        });
    });

    teardown((done) => {
        _logger.close(null, done);
    });

    test('Log Level', () => {
        _fixture.testLogLevel();
    });

    test('Simple Logging', (done) => {
        _fixture.testSimpleLogging(done);
    });

    test('Error Logging', (done) => {
        _fixture.testErrorLogging(done);
    });

});