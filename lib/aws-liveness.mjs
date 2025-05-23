import createDebug from 'debug';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { KinesisClient, ListStreamsCommand } from '@aws-sdk/client-kinesis';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListPlatformApplicationsCommand } from '@aws-sdk/client-sns';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';

const debug = createDebug('aws-liveness');

const defaultServices = [{
  test: client => client instanceof DynamoDBClient,
  ping: client => client.send(new ListTablesCommand())
}, {
  test: client => client instanceof KinesisClient,
  ping: client => client.send(new ListStreamsCommand())
}, {
  test: client => client instanceof S3Client,
  ping: client => client.send(new ListBucketsCommand())
}, {
  test: client => client instanceof SNSClient,
  ping: client => client.send(new ListPlatformApplicationsCommand())
}, {
  test: client => client instanceof SQSClient,
  ping: client => client.send(new ListQueuesCommand())
}];

export default class AWSLiveness {
  constructor({ services = [] } = {}) {
    this._services = [...services, ...defaultServices];
  }

  ping({ client }) {
    const service = this._services.find(svc => svc.test(client));
    if (service) return service.ping(client);
    throw new RangeError('Impossible to ping client. Unknown client type.');
  }

  async waitForServices({ clients, waitSeconds }) {
    const end = Date.now() + waitSeconds * 1000;

    while (true) {
      try {
        // ping here all the services that we need to wait for
        return await Promise.all(clients.map(client => this.ping({ client })));
      } catch (err) {
        debug(`Ping failed: ${err.message}`);
        const now = Date.now();
        if (end < now) {
          throw new Error(`Timed out waiting: ${err.message}`);
        }
        const secondsLeft = (end - now) / 1000;
        debug(`Retrying, ${secondsLeft} seconds left`);
      }
    }
  }
}
