////
// MessageService Decorator
// -------------------
// This wraps the pubnub libarary so we can handle the uuid and list
// of subscribed channels.
////
function MessageService() {
    this.publishKey = 'pub-c-a6ad4cf5-c4d0-4df6-bf63-c483a579e3c8';
    this.subscribeKey = 'sub-c-214d6016-7a34-11e3-882a-02ee2ddab7fe';

    this.subscriptions=[]; //an array to maintain where i'm suscribed to. Just an array of ids.
    this.connection=null;
}

/**
 * Connect to the service with my username
 * @param username
 */
MessageService.prototype.connect = function(username) {
    this.username = username;

    //if not connected, connect. Else, dont do it.
    if (this.connection==null) {
        try {
            this.connection = PUBNUB.init({
                publish_key: this.publishKey,
                subscribe_key: this.subscribeKey,
                uuid: this.username,
                ssl: true
            });
            console.log('connected');
        } catch (e) {
            console.log("ERROR CONNECTING!!!!");
            console.log(e);
        }
    }

};

/**
 * Suscribe to a service. It calls the suscription servive.
 * And Also adds the suscription to the array
 * Also checks that suscriptions is not already in the array
 * @param channelId channel ID to subscribe to
 * @param fnOnMessage function to call when message arives
 */
MessageService.prototype.subscribe = function(channelId,fnOnMessage) {
    //checks if it is not already suscribed (to avoid double suscriptions)
    if (!this._containsChannels(this.subscriptions,channelId)) {
        console.log("Suscribing new to... "+channelId);
        this.connection.subscribe({
            channel:channelId,
            message:fnOnMessage,
            restore: true,
            reconnect: function(rc) {
                console.log('reconnected!');
                if (rc) console.log(rc);
                CommonUtil.reactivateQueue(0);
            },
            error: function(e) {
                //console.log("Error suscribing!?");
                //console.log(JSON.stringify(e));
            }
        });
        this._addSubscription(channelId);
    } else {
        //console.log('suscription already existed');
    }
    //console.log(this.subscriptions);
};


MessageService.prototype.publish = function(ch,message,fnOnOk,fnOnError) {
    console.log("publishing to... "+ch);
    this.connection.publish({
        channel:ch,
        message: message,
        callback: function(m) {
            //when PUBNUB doesnt send it for  connecting error, then sends [0,x,x]
            if (m[0]==1) { fnOnOk(m); } else { fnOnError(m); }
        },
        error:fnOnError
    });
};

MessageService.prototype.history = function() {
    this.connection.history.apply(this.connection, arguments);
};


//////////// PRIVATES
/**
 * Add suscription to suscriptions array if it is not. It does not suscribe.
 * @param channel
 */
MessageService.prototype._addSubscription = function(channel) {
    this.subscriptions.push(channel);
    this.subscriptions = CommonUtil.arrayUnique(this.subscriptions);
    console.log(this.subscriptions);
};

/**
 * Removes suscription from suscriptions array if it exists. It does not unsuscribe.
 * @param channel

MessageService.prototype._removeSubscription = function(channel) {
    if (this.subscriptions.indexOf(channel) !== -1) {
        this.subscriptions.splice(this.subscriptions.indexOf(channel), 1);
    }
};
 */

/**
 * Check if the obj elements is contained in the a array.
 * Checks if obj === a[i]
 * @param a array
 * @param obj element
 * @returns {boolean}
 * @private
 */
MessageService.prototype._containsChannels = function(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
};


