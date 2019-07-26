'use strict';

const { DynamoDB, Kinesis, S3, SNS, SQS } = require('aws-sdk');
const { expect } = require('chai');
const sinon = require('sinon');

const AWSLiveness = require('./aws-liveness');

describe('AWSLiveness', () => {
  let awsLiveness;

  beforeEach(() => {
    awsLiveness = new AWSLiveness();
  });

  describe('ping', () => {
    it('pings DynamoDB', async () => {
      const dynamoDBClient = new DynamoDB();
      const listTablesPromise = sinon.mock();

      listTablesPromise.promise = sinon.stub().resolves(['fakeTable']);
      sinon.stub(dynamoDBClient, 'listTables').returns(listTablesPromise);

      const pingResponse = await awsLiveness.ping({ client: dynamoDBClient });

      expect(dynamoDBClient.listTables.called).to.be.true;
      expect(listTablesPromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals(['fakeTable']);
    });

    it('pings DynamoDB using a customize ping method', async () => {
      const customServices = [{
        test: client => client instanceof DynamoDB,
        ping: client => client.describeTable({ TableName: 'Foo' }).promise()
      }];

      awsLiveness = new AWSLiveness({ services: customServices });

      const dynamoDBClient = new DynamoDB();
      const describeTablePromise = sinon.mock();

      describeTablePromise.promise = sinon.stub()
        .resolves({ Table: { TableName: 'Foo' } });
      sinon.stub(dynamoDBClient, 'describeTable').returns(describeTablePromise);

      const pingResponse = await awsLiveness.ping({ client: dynamoDBClient });

      expect(dynamoDBClient.describeTable.called).to.be.true;
      expect(describeTablePromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals({ Table: { TableName: 'Foo' } });
    });

    it('pings Kinesis', async () => {
      const kinesisClient = new Kinesis();
      const listStreamsPromise = sinon.mock();

      listStreamsPromise.promise = sinon.stub().resolves(['fakeStream']);
      sinon.stub(kinesisClient, 'listStreams').returns(listStreamsPromise);

      const pingResponse = await awsLiveness.ping({ client: kinesisClient });

      expect(kinesisClient.listStreams.called).to.be.true;
      expect(listStreamsPromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals(['fakeStream']);
    });

    it('pings S3', async () => {
      const s3Client = new S3();
      const listBucketsPromise = sinon.mock();

      listBucketsPromise.promise = sinon.stub().resolves(['fakeBucket']);
      sinon.stub(s3Client, 'listBuckets').returns(listBucketsPromise);

      const pingResponse = await awsLiveness.ping({ client: s3Client });

      expect(s3Client.listBuckets.called).to.be.true;
      expect(listBucketsPromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals(['fakeBucket']);
    });

    it('pings SNS', async () => {
      const snsClient = new SNS();
      const listPlatAppsPromise = sinon.mock();

      listPlatAppsPromise.promise = sinon.stub()
        .resolves(['fakePlatformApplication']);
      sinon.stub(snsClient, 'listPlatformApplications')
        .returns(listPlatAppsPromise);

      const pingResponse = await awsLiveness.ping({ client: snsClient });

      expect(snsClient.listPlatformApplications.called).to.be.true;
      expect(listPlatAppsPromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals(['fakePlatformApplication']);
    });

    it('pings SQS', async () => {
      const sqsClient = new SQS();
      const listQueuesPromise = sinon.mock();

      listQueuesPromise.promise = sinon.stub().resolves(['fakeQueue']);
      sinon.stub(sqsClient, 'listQueues').returns(listQueuesPromise);

      const pingResponse = await awsLiveness.ping({ client: sqsClient });

      expect(sqsClient.listQueues.called).to.be.true;
      expect(listQueuesPromise.promise.called).to.be.true;
      expect(pingResponse).deep.equals(['fakeQueue']);
    });

    it('fails if unknown client', async () => {
      const unknownClient = sinon.mock();

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
      fakeDynamoDBClient = sinon.mock();
      fakeSNSClient = sinon.mock();
    });

    it('waits for services to be ready', async () => {
      sinon.stub(awsLiveness, 'ping').resolves();

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
      sinon.stub(awsLiveness, 'ping').callsFake(rejectWithDelay);

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
