# ablyd-client

[![npm version](https://img.shields.io/npm/v/ablyd-client.svg?style=flat)](https://img.shields.io/npm/v/ablyd-client.svg?style=flat)

A JavaScript library for interacting with [AblyD](https://www.github.com/ably-labs/ablyd), a program which allows for simple creation and control of command-line interace processes via [Ably Realtime](https://www.ably.com), a realtime data delivery platform.

## Installation

### Node.js

    npm install ablyd-client --save

and require as:

```javascript
var AblyDClient = require('ablyd-client');
```

## Introduction

All examples assume a client has been created as follows:

```javascript
// basic auth with an API key
var ablydClient = new AblyDClient("API_KEY");

// using a Client Options object, see https://www.ably.com/documentation/realtime/usage#client-options
// which must contain at least one auth option, i.e. at least
// one of: key, token, tokenDetails, authUrl, or authCallback
var ablydClient = new AblyDClient(clientOptionsObject);
```

### Starting a Process

Assuming you have an AblyD instance running on the same app as the auth details provided, you can start a process on it with:

```javascript
ablydClient.startNewProcess(serverID, args, function(err, ablydProcess) {
    if (err) console.log(err);
});
```

An error is returned if no active AblyD instances exist which are listening for commands.

Alternatively if there's an already active process you'd like to interact with, you can get it with:

```javascript
ablydClient.getProcess("process:namespace", function(ablydProcess) {
    ...
});
```

### Checking currently active processes

You can get a list of active processes with:

```javascript
// Get all active processes
ablydClient.getProcesses(function(ablydProcesses) {
    ablydProcesses // [ '382448', '372849', '232498' ]
});
```

You can also get the channel names for processes, which is useful for using `getProcess`:

```javascript
ablydClient.getProcessChannels(function(processChannels) {
    processChannels // [ 'ablyd:c41svahe008bcgv37el0:48506', 'ablyd:c41svahe008bcgv37el0:48518' ]
});
```

### Subscribing to a process

You can subscribe to the output of a process with:

```javascript
err = ablydClient.subscribe(function (message) {
  message.name; // 'greeting'
  message.data; // 'Hello World from process!'
});
```

### Publishing to a channel

```javascript
// Publish a single message with name and data
ablydProcess.publish('greeting', 'Hello World from client to process!');

// Optionally, you can use a callback to be notified of success or failure
ablyDProcess.publish('greeting', 'Hello World from client to process!', function(err) {
  if(err) {
    console.log('publish failed with error ' + err);
  } else {
    console.log('publish succeeded');
  }
});
```
### Listening to server changes

You can see what the state of currently active AblyD servers are with:

```javascript
ablydClient.getServerStatuses((err, serverStatuses) {
    serverStatuses[0] // {
                      //   action: 'present',
                      //   id: 'TV8-xpttP-:4:0',
                      //   timestamp: 1627643396934,
                      //   clientId: 'c41trvpe008d13aqm8tg',
                      //   connectionId: 'TV8-xpttP-',
                      //   data: {
                      //     ServerID: 'c41trvpe008d13aqm8tg',
                      //     Namespace: 'ablyd',
                      //     MaxProcesses: 20,
                      //     Processes: { '53392': 'Running' }
                      //   },
                      //   encoding: null,
                      //   size: undefined
                      // }
});
```

You can listen for whenever servers start with:

```javascript
ablydClient.subscribeToServerStarted((serverStartedMessage) => {

});
```

You can listen for whenever servers stops with:

```javascript
ablydClient.subscribeToServerStopped((serverStartedMessage) => {

});
```

You can listen for whenever server's state changes (such as a new process starting on it):

```javascript
ablydClient.subscribeToServerChanged((serverStartedMessage) => {

});
```

## Support, feedback and troubleshooting

Please view or report issues to the [Github issues](https://github.com/ably-labs/ablyd-client/issues).
