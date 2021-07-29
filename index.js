const Ably = require('ably');
const InstanceObject = require('./instanceObject');

const INSTANCE_STARTED_NAME = 'new-instance';
const START_INSTANCE_NAME = 'start';

class AblyDClient {
  constructor(ablyAuthDetails, namespace="ablyd") {
    this.ably = new Ably.Realtime(ablyAuthDetails);
    this.namespace = namespace;
    this.commandChannel = this.ably.channels.get(`${this.namespace}:command`);
  }

  startNewInstance(callback, serverID, args) {
    let messageID = Math.random().toString();
    let data = {
      "MessageID": messageID,
    };
    if (serverID) data["ServerID"] = serverID;
    if (serverID) data["Args"] = args;
    this.commandChannel.subscribe(INSTANCE_STARTED_NAME, (msg) => {
      if (msg.data.MessageID == messageID) {
        let instanceNamespace = `${msg.data.ChannelPrefix}${msg.data.Pid}`;

        let newInstance = new InstanceObject(this.ably, instanceNamespace);
        callback(newInstance);
      }
    });    
    this.commandChannel.publish(START_INSTANCE_NAME, data);
  }

  getInstance(instanceNamespace, callback) {
    let newInstance = new InstanceObject(this.ably, instanceNamespace);
    callback(newInstance);
  }

  subscribeToInstance(instanceID, callback) {
    this.ably.channels.get(`${instanceID}:serveroutput`).subscribe(callback);
  }

  getInstances(serverID) {
    let currentInstances = [];
    let presenceSet = this.commandChannel.presence.members.map;
    for (const presenceMember in presenceSet) {
      if (serverID && presenceSet[presenceMember].clientId == serverID) {
        return presenceSet[presenceMember].Instances;
      }
      for (const instances in presenceSet[presenceMember].data.Instances) {
        currentInstances.push(instances);
      }
    }
    return currentInstances;
  }

  getInstanceChannels(serverID) {
    let currentInstances = [];
    let presenceSet = this.commandChannel.presence.members.map;
    for (const presenceMember in presenceSet) {
      if (!serverID || presenceSet[presenceMember].clientId == serverID) {
        for (const instances in presenceSet[presenceMember].data.Instances) {
          currentInstances.push(`${this.namespace}:${presenceSet[presenceMember].clientId}:${instances}`);
        }
      }
    }
    return currentInstances;
  }

  // Servers
  getServerStatuses(callback) {
    this.commandChannel.presence.get(callback);
  }

  subscribeToServerOpen(callback) {
    this.commandChannel.presence.subscribe('enter', callback);
  }

  subscribeToServerClose(callback) {
    this.commandChannel.presence.subscribe('leave', callback);
  }

  subscribeToServerChange(callback) {
    this.commandChannel.presence.subscribe('update', callback);
  }
}

module.exports = AblyDClient;
