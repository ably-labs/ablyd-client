const Ably = require('ably');
const ProcessObject = require('./processObject');

var AblyDClient = (function() {
    const PROCESS_STARTED_NAME = 'new-instance';
    const START_PROCESS_NAME = 'start';

    function AblyDClient(ablyAuthDetails, namespace = "ablyd") {
        this.ably = new Ably.Realtime(ablyAuthDetails);
        this.namespace = namespace;
        this.commandChannel = this.ably.channels.get(`${this.namespace}:command`);
    }

    AblyDClient.processListenerArgs = function(args) {
        /* [serverID], [args], [callback] */
        args = Array.prototype.slice.call(args);

        if (typeof args[0] === 'function') {
            args.unshift(null);
            args.unshift(null);
        }

        // If args specified but not serverID, shift
        if (typeof args[0] === 'array') {
            args.unshift(null);
        }

        if (args[args.length - 1] == undefined) {
            args.pop();
        }
        return args;
    }

    AblyDClient.prototype.startNewProcess = function(/* [serverID], [args], [callback] */) {
        var startArgs = AblyDClient.processListenerArgs(arguments);
        var serverID = startArgs[0];
        var processArgs = startArgs[1];
        var callback = startArgs[2];

        this.commandChannel.presence.get((err, presenceSet) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (presenceSet.length == 0) {
                callback("Error: No AblyD servers currently active", null);
                return;              
            }

            var messageID = Math.random().toString();
            var data = {
                "MessageID": messageID,
            };
            if (serverID) data["ServerID"] = serverID;
            if (processArgs) data["Args"] = processArgs;

            let tmpSub = this.commandChannel.subscribe(PROCESS_STARTED_NAME, (msg) => {
                if (msg.data.MessageID == messageID) {
                    var processNamespace = `${msg.data.ChannelPrefix}${msg.data.Pid}`;

                    var newProcess = new ProcessObject(this.ably, processNamespace);
                    this.commandChannel.unsubscribe(tmpSub);
                    callback(null, newProcess);
                }
            });

            this.commandChannel.publish(START_PROCESS_NAME, data);
        });
    }

    AblyDClient.prototype.getProcess = function(processNamespace, callback) {
        var newProcess = new ProcessObject(this.ably, processNamespace);
        callback(newProcess);
    };

    AblyDClient.prototype.getProcesses = function(/* [serverID...], callback */) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === 'function') {
            args.unshift(null);
        }
        var serverID = args[0];
        var callback = args[args.length - 1];

        this.commandChannel.presence.get((err, presenceSet) => {
          var currentProcesses = [];

          for (const presenceMember in presenceSet) {
              if (serverID && presenceSet[presenceMember].clientId == serverID) {
                  return presenceSet[presenceMember].Instances;
              }
              for (const processes in presenceSet[presenceMember].data.Instances) {
                  currentProcesses.push(processes);
              }
          }

          callback(currentProcesses);
        });
    }

    AblyDClient.prototype.getProcessChannels = function(/* [serverID...], callback */) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === 'function') {
            args.unshift(null);
        }
        var serverID = args[0];
        var callback = args[args.length - 1];

        this.commandChannel.presence.get((err, presenceSet) => {
          var currentProcesses = [];

          for (const presenceMember in presenceSet) {
              if (!serverID || presenceSet[presenceMember].clientId == serverID) {
                  for (const processes in presenceSet[presenceMember].data.Instances) {
                      currentProcesses.push(`${this.namespace}:${presenceSet[presenceMember].clientId}:${processes}`);
                  }
              }
          }

          callback(currentProcesses);
        });
    }

    // Servers
    AblyDClient.prototype.getServerStatuses = function(callback) {
        this.commandChannel.presence.get(callback);
    }

    AblyDClient.prototype.subscribeToServerStarted = function(callback) {
        this.commandChannel.presence.subscribe('enter', callback);
    }

    AblyDClient.prototype.subscribeToServerStopped = function(callback) {
        this.commandChannel.presence.subscribe('leave', callback);
    }

    AblyDClient.prototype.subscribeToServerChanged = function(callback) {
        this.commandChannel.presence.subscribe('update', callback);
    }

    return AblyDClient;
})();

module.exports = AblyDClient;
