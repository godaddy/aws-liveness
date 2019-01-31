# aws-liveness

AWS Liveness tools.

## Install

```console
npm i --save aws-liveness
```

## Usage

```js
const AWSLiveness = require('aws-liveness');
const { DynamoDB } = require('aws-sdk');

const awsLiveness = new AWSLiveness();
const dynamoDBClient = new DynamoDB();

// ping and wait services up to 10 seconds
awsLiveness.waitForServices({
  clients: [dynamoDBClient],
  waitSeconds: 10
})
  .then(() => console.log('services liveness ok'))
  .catch(console.error);

// ping a service
awsLiveness.ping({ client: dynamoDBClient })
  .then(() => console.log('dynamodb ping success'))
  .catch(console.error);
```

## Customization

You can customize and/or extend `aws-liveness` tools to fit your application needs.

```js
const AWSLiveness = require('aws-liveness');
const { DynamoDB } = require('aws-sdk');

class MyCustomService {
  async fetchSomeData () {
    return { foo: 'bar' }
  }
}

const customServices = [{
  test: client => client instanceof DynamoDB,
  ping: client => client.describeTable({ TableName: 'Foo' }).promise()
}, {
  test: client => client instanceof MyCustomService,
  ping: client => client.fetchSomeData()
}]

const awsLiveness = new AWSLiveness({ services: customServices });
const dynamoDBClient = new DynamoDB();
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

You can use this module to ensure that [LocalStack](https://) services are up and running before you test and/or start your application.

```js
// ping-localstack.js
const dynamoDBClient = new DynamoDB({
  endpoint: process.env.DYNAMODB_ENDPOINT
});

if (require.main === module) {
  awsLiveness.waitForServices({
    clients: [snsClient, sqsClient],
    waitSeconds: process.env.WAIT_SECONDS || 10
  })
    .catch(console.error);
}
```

```json
{
  "scripts": {
    "localstack": "docker run -it -p 4569:4569 -p 9999:8080 --rm localstack/localstack",
    "localstack-wait": "AWS_ACCESS_KEY_ID=fakeid AWS_SECRET_ACCESS_KEY=fakekey node ping-localstack.js",
    "start": "node app.js",
    "test-e2e": "AWS_ACCESS_KEY_ID=fakeid AWS_SECRET_ACCESS_KEY=fakekey mocha test-e2e/**/*.test.js",
  }
}
```

```console
DYNAMODB_ENDPOINT=http://localhost:4569 npm run localstack-wait && npm run test-e2e
```

## Contributing

1. Commits to `master` must be done through a _Pull Request_ and _Squash and Merge_ option.

2. Add a title and body that follows the [Conventional Commits Specification](https://www.npmjs.com/package/@commitlint/config-conventional).
