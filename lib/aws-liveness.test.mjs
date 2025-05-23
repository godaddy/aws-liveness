import { expect, use } from 'chai';
import { match, mock, stub } from 'sinon';
import sinonChai from 'sinon-chai';

import { DescribeTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { KinesisClient, ListStreamsCommand } from '@aws-sdk/client-kinesis';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { ListPlatformApplicationsCommand, SNSClient } from '@aws-sdk/client-sns';
import { ListQueuesCommand, SQSClient } from '@aws-sdk/client-sqs';

import AWSLiveness from './aws-liveness.mjs';

use(sinonChai);

describe('AWSLiveness', () => {
  let awsLiveness;

  beforeEach(() => {
    awsLiveness = new AWSLiveness();
  });

  describe('ping', () => {
    it('pings DynamoDB', async () => {
      const dynamoDBClient = new DynamoDBClient();
      stub(dynamoDBClient, 'send').resolves(['fakeTable']);

      const pingResponse = await awsLiveness.ping({ client: dynamoDBClient });

      expect(dynamoDBClient.send).to.be.calledWith(match.instanceOf(ListTablesCommand));
      expect(pingResponse).deep.equals(['fakeTable']);
    });

    it('pings DynamoDB using a customize ping method', async () => {
      const customServices = [{
        test: client => client instanceof DynamoDBClient,
        ping: client => client.send(new DescribeTableCommand({ TableName: 'Foo' }))
      }];

      awsLiveness = new AWSLiveness({ services: customServices });

      const dynamoDBClient = new DynamoDBClient();
      stub(dynamoDBClient, 'send').resolves({ Table: { TableName: 'Foo' } });

      const pingResponse = await awsLiveness.ping({ client: dynamoDBClient });

      expect(dynamoDBClient.send).to.be.calledWith(match.instanceOf(DescribeTableCommand));
      expect(pingResponse).deep.equals({ Table: { TableName: 'Foo' } });
    });

    it('pings Kinesis', async () => {
      const kinesisClient = new KinesisClient();
      stub(kinesisClient, 'send').resolves(['fakeStream']);

      const pingResponse = await awsLiveness.ping({ client: kinesisClient });

      expect(kinesisClient.send).to.be.calledWith(match.instanceOf(ListStreamsCommand));
      expect(pingResponse).deep.equals(['fakeStream']);
    });

    it('pings S3', async () => {
      const s3Client = new S3Client();
      stub(s3Client, 'send').resolves(['fakeBucket']);

      const pingResponse = await awsLiveness.ping({ client: s3Client });

      expect(s3Client.send).to.be.calledWith(match.instanceOf(ListBucketsCommand));
      expect(pingResponse).deep.equals(['fakeBucket']);
    });

    it('pings SNS', async () => {
      const snsClient = new SNSClient();
      stub(snsClient, 'send').resolves(['fakePlatformApplication']);

      const pingResponse = await awsLiveness.ping({ client: snsClient });

      expect(snsClient.send).to.be.calledWithMatch(match.instanceOf(ListPlatformApplicationsCommand));
      expect(pingResponse).deep.equals(['fakePlatformApplication']);
    });

    it('pings SQS', async () => {
      const sqsClient = new SQSClient();
      stub(sqsClient, 'send').resolves(['fakeQueue']);

      const pingResponse = await awsLiveness.ping({ client: sqsClient });

      expect(sqsClient.send).to.be.calledWithMatch(match.instanceOf(ListQueuesCommand));
      expect(pingResponse).deep.equals(['fakeQueue']);
    });

    it('fails if unknown client', async () => {
      const unknownClient = mock();

      let error;
      try {
        await awsLiveness.ping({ client: unknownClient });
      } catch (err) {
        error = err;
      }

      expect(error).to.not.be.undefined;
      expect(error.message).equals('Impossible to ping client. Unknown client type.');
    });
  });

  describe('waitForServices', () => {
    let fakeDynamoDBClient;
    let fakeSNSClient;

    beforeEach(() => {
      fakeDynamoDBClient = mock();
      fakeSNSClient = mock();
    });

    it('waits for services to be ready', async () => {
      stub(awsLiveness, 'ping').resolves();

      const clients = [fakeDynamoDBClient, fakeSNSClient];
      const waitSeconds = 10;

      await awsLiveness.waitForServices({ clients, waitSeconds });

      expect(awsLiveness.ping.calledWith({ client: fakeDynamoDBClient })).to.be.true;
      expect(awsLiveness.ping.calledWith({ client: fakeDynamoDBClient })).to.be.true;
    });

    it('stops waiting if services do not become ready', async () => {
      const rejectWithDelay = () => new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('fake error')), 0);
      });
      stub(awsLiveness, 'ping').callsFake(rejectWithDelay);

      const clients = [fakeDynamoDBClient];
      const waitSeconds = 0.01;

      let error;
      try {
        await awsLiveness.waitForServices({ clients, waitSeconds });
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.undefined;
      expect(error.message).equals('Timed out waiting: fake error');
    });
  });
});
