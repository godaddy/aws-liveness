'use strict';

/* eslint-disable no-console */

const { DynamoDB, S3, SNS, SQS } = require('aws-sdk');
const debug = require('debug')('aws-liveness');

const defaultServices = [{
  test: client => client instanceof DynamoDB,
  ping: client => client.listTables().promise()
}, {
  test: client => client instanceof S3,
  ping: client => client.listBuckets().promise()
}, {
  test: client => client instanceof SNS,
  ping: client => client.listPlatformApplications().promise()
}, {
  test: client => client instanceof SQS,
  ping: client => client.listQueues().promise()
}];

class AWSLiveness {
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

    // eslint-disable-next-line no-constant-condition
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

module.exports = AWSLiveness;
