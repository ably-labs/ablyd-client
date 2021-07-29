class InstanceObject {
   constructor(ably, instanceNamespace) {
      this.instanceNamespace = instanceNamespace;
      this.serverinput = ably.channels.get(`${this.instanceNamespace}:serverinput`);
      this.serveroutput = ably.channels.get(`[?rewind=2m]${this.instanceNamespace}:serveroutput`);
   }

   subscribe(callback) {
      this.serveroutput.subscribe(callback);
   }

   publish(name, message, callback) {
      this.serverinput.publish(name, message, callback);
   }

   attach() {
      this.serverinput.attach();
      this.serveroutput.attach();
   }

   detach() {
      this.serverinput.detach();
      this.serveroutput.detach();
   }
}

module.exports = InstanceObject;
