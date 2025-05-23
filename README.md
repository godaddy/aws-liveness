[![Build Status](https://travis-ci.com/godaddy/aws-liveness.svg?branch=master)](https://travis-ci.com/godaddy/aws-liveness) [![Greenkeeper badge](https://badges.greenkeeper.io/godaddy/aws-liveness.svg)](https://greenkeeper.io/)

# aws-liveness

Waits for AWS/localstack services to be up and running.

## Install

```console
npm i --save aws-liveness
```

## Usage

```javascript
import AWSLiveness from '@godaddy/aws-liveness';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const awsLiveness = new AWSLiveness();

// ping and wait services up to 10 seconds
try {
  await awsLiveness.waitForServices({
    clients: [new DynamoDBClient()],
    waitSeconds: 10
  });
  console.log('services are live');
} catch (err) {
  console.error('service liveness failed', err);
}

// ping a service
try {
  await awsLiveness.ping({ client: new DynamoDBClient() });
  console.log('dynamodb ping success');
} catch (err) {
  console.error('dynamodb ping failed', err);
}
```

## Customization

By default, `AWSLiveness` supports running the following liveness commands for the following client types:

| Client | Method |
| ------- | ------ |
| `DynamoDBClient` | `ListTablesCommand` |
| `KinesisClient` | `ListStreamsCommand` |
| `S3Client` | `ListBucketsCommand` |
| `SNSClient` | `ListPlatformApplicationsCommand` |
| `SQSClient` | `ListQueuesCommand` |

 You can also create additional checks to customize liveness.

```js
import AWSLiveness from '@godaddy/aws-liveness';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

class MyCustomService {
  async fetchSomeData () {
    return { foo: 'bar' }
  }
}

const customServices = [{
  test: client => client instanceof DynamoDBClient,
  ping: client => client.send(new DescribeTableCommand({ TableName: 'Foo' }))
}, {
  test: client => client instanceof MyCustomService,
  ping: client => client.fetchSomeData()
}]

const awsLiveness = new AWSLiveness({ services: customServices });
const dynamoDBClient = new DynamoDBClient();
const myCustomService = new MyCustomService();

awsLiveness.ping({ client: dynamoDBClient })
  .then(() => console.log('dynamodb ping success'))
  .catch(console.error);

awsLiveness.ping({ client: myCustomService })
  .then(() => console.log('my custom service ping success'))
  .catch(console.error);
```

## Debug

AWS Liveness uses [debug](https://www.npmjs.com/package/debug) module internally to log information about ping requests and services status. Logging is turned off by default and can be conditionally turned on by setting the `DEBUG` environment variable equals to `aws-liveness`.

## Examples

### Localstack

You can use this module to ensure that [LocalStack](https://www.localstack.cloud/) services are up and running before you test and/or start your application.

```js
// ping-localstack.js
const dynamoDBClient = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT
});

try {
  await awsLiveness.waitForServices({
    clients: [dynamoDBClient],
    waitSeconds: process.env.WAIT_SECONDS || 10
  });
} catch (err) {
  console.error('service liveness failed', err);
  process.exit(1);
}
```

```json
{
  "scripts": {
    "localstack": "docker run -it -p 4569:4569 -p 9999:8080 --rm localstack/localstack",
    "localstack-wait": "AWS_ACCESS_KEY_ID=fakeid AWS_SECRET_ACCESS_KEY=fakekey node ping-localstack.js",
    "test-e2e": "npm run localstack && npm run localstack-wait && AWS_ACCESS_KEY_ID=fakeid AWS_SECRET_ACCESS_KEY=fakekey mocha test-e2e/**/*.test.js"
  }
}
```

## Contributing

1. Commits to `master` must be done through a _Pull Request_ and _Squash and Merge_ option.

2. Add a title and body that follows the [Conventional Commits Specification](https://www.npmjs.com/package/@commitlint/config-conventional).
