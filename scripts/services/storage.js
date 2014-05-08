////
// Storage Decorator
// -------------------
// This wraps the storage library, so we can focus on Web SQL or Files
// Web SQL is not implemented in all platforms, so it would be good to have two storage implementations.
// We have to take care of synchronicity in File implementations.
//We limit in this implementation to 20 messages / chat
////
var MAXNUMMSG=20;

function MessengerStorage() {

}

MessengerStorage.CONSTANT = {
    STORAGE_SUSCRIPTIONS : "sphiral.storage_suscriptions"
};

MessengerStorage.prototype.addMessage = function(channel,message,fnCallback) {
    this.getMessages(channel,function(messages) {
        messages.push(message); ////JSON.stringify(message, null, 2);
        messages=messages.slice(-MAXNUMMSG);
        localStorage["channel_"+encodeURIComponent(channel)]=JSON.stringify(messages);
        if (fnCallback!=undefined) {
            fnCallback();
        }
    });

};

/**
 * Drop all messages from a channel and insert all them
 * @param channel
 * @param messages
 */
MessengerStorage.prototype.replaceMessages = function(channel,messages) {
    console.log("ReplaceMessages - Number of messages: "+messages.length);
    messages=messages.slice(-MAXNUMMSG);
    //console.log("ReplaceMessages - Number of messages: "+messages.length);
    localStorage["channel_"+encodeURIComponent(channel)]=JSON.stringify(messages);
};

/**
 * Returns a JSON of message with:
 *  text
 *  username
 *  realname
 *  receivedTime
 *  sentTime
 *  unread (true / false)
 * @param channel
 * @param fnCallback
 */
MessengerStorage.prototype.getMessages = function(channel,fnCallback) {
    var messages=localStorage["channel_"+encodeURIComponent(channel)];
    var jsonMess=[];
    if (messages!=undefined  ) {
        try {
            jsonMess=JSON.parse(messages);
            if (Object.prototype.toString.call( jsonMess ) === '[object Array]' ) {

            } else {
                jsonMess=[];
            }
            //console.log("mensajes: "+jsonMess);
        } catch (e) {
            console.log("error: "+e);
        }
    }
    fnCallback(jsonMess);
};

/**
 * Atomically, returns a JSON of ONE message from a channel.
 * (Used generally in the sending retry queue channel)
 *  text
 *  username
 *  receivedTime
 *  realname
 *  sentTime
 *  unread (true / false)
 * @param channel

 */
MessengerStorage.prototype.popMessage = function(channel) {
    var messages=localStorage["channel_"+encodeURIComponent(channel)];
    var element=null;
    var jsonMess=[];
    if (messages!=undefined  ) {
        try {
            jsonMess=JSON.parse(messages);
            if (Object.prototype.toString.call( jsonMess ) === '[object Array]' ) {
                console.log("queue with size before: "+jsonMess.length);
                element=jsonMess.shift();
            } else {
                jsonMess=[];
            }
            //console.log("mensajes: "+jsonMess);
        } catch (e) {
            console.log("error: "+e);
        }
    }
    localStorage["channel_"+encodeURIComponent(channel)]=JSON.stringify(jsonMess);
    console.log("queue with size after: "+jsonMess.length);
    return element;
};



/**
 * Mark all messages as read in a channel
 *  txt
 *  username
 *  unread (true / false)
 * @param channel
 * @param fnCallback
 */
MessengerStorage.prototype.markMessagesRead = function(channel) {
    var msp=this;
    this.getMessages(channel,function(ms) {
        ms.forEach(function(m) {
            m.unread=false;
        });
        msp.replaceMessages(channel,ms);
    });
};

/**
 * Recovers groups from local disk
 * @param fnCallback
 */
MessengerStorage.prototype.getLocalGroups = function(fnCallback) {
    var suscriptions=[];
    var jsonSuscriptions=localStorage[MessengerStorage.CONSTANT.STORAGE_SUSCRIPTIONS];
    if (jsonSuscriptions!=undefined) {
        try {
            suscriptions=JSON.parse(jsonSuscriptions);
        } catch (e) {
            console.log(e);
        }
    }
    fnCallback(suscriptions);
}

/**
 * Saves groups into local disk
 * @param fnCallback (optional)
 */
MessengerStorage.prototype.setLocalGroups = function(groups,fnCallback) {
    localStorage[MessengerStorage.CONSTANT.STORAGE_SUSCRIPTIONS]=JSON.stringify(groups);
    if (fnCallback!=undefined) { fnCallback(); }
}

/**
 * Empties the storage of a group, given its chatId
 * @param chatId (required)
 * @param fnCallback (optional)
 */
MessengerStorage.prototype.emptyGroup = function(chatId,fnCallback) {
    console.log("empty channel_"+encodeURIComponent(chatId))
    localStorage["channel_"+encodeURIComponent(chatId)]=JSON.stringify([]);
    if (fnCallback!=undefined) { fnCallback(); }
}



/*********************************** PRIVATES NOT NEEDED TO BE EXPOSED **********************************/
// PRIVATES:
