var ProcessObject = (function() {

    function ProcessObject(ably, processNamespace) {
        this.processNamespace = processNamespace;
        this.serverinput = ably.channels.get(`${this.processNamespace}:serverinput`);
        this.serveroutput = ably.channels.get(`[?rewind=2m]${this.processNamespace}:serveroutput`);
    }

    ProcessObject.prototype.subscribe = function(callback) {
        this.serveroutput.presence.get((err, presenceSet) => {
            if (err) {
                return err;
            }
            if (presenceSet.length == 0) {
                return "Error: No AblyD server is currently listening for this process";
            }

            this.serveroutput.subscribe(callback);
        });
    }

    ProcessObject.prototype.publish = function(name, message, callback) {
        this.serverinput.presence.get((err, presenceSet) => {
            if (err) {
                callback(err);
                return;
            }
            if (presenceSet.length == 0) {
                callback("Error: No AblyD server is currently listening for this process");
                return;
            }

            this.serverinput.publish(name, message, callback);
        });
    }

    ProcessObject.prototype.attach = function() {
        this.serverinput.attach();
        this.serveroutput.attach();
    }

    ProcessObject.prototype.detach = function() {
        this.serverinput.detach();
        this.serveroutput.detach();
    }

    return ProcessObject;
})();

module.exports = ProcessObject;