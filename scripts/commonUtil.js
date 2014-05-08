'use strict';

var CommonUtil = {};
CommonUtil.CONSTANT={

    LOCALSTORAGE_USERNAME : "initmsgr_username",
    LOCALSTORAGE_PASSWORD : "initmsgr_password",
    LOCALSTORAGE_COMPLETENAME : "initmsgr_complete_name",
    QUEUE_RETRY_SEND_MSGS : "initmsgr_queue_4815162342",
    QUEUE_INTERVAL_RETRY : 1000, //msecs
    QUEUE_MAX_INTERVAL_RETRY : 100000,
    QUEUE_TIMEOUT_POINTER : undefined
};

/**
 * Get logged in username. If not, then empty is returned.
 * Best practice to check if username is loggedin is to check if this is return false;
 * @returns {*}
 */
CommonUtil.getLoggedUsername= function() {
    if (CommonUtil.isLoggedIn()) {
        return localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_USERNAME];
    }
    return "";
};

CommonUtil.getLoggedCompleteName= function() {
    if (CommonUtil.isLoggedIn()) {
        return localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_COMPLETENAME];
    }
    return "";
};

/**
 * Checks if user is loggedin. Best way to check it, is using getLoggedUsername.
 * @returns {boolean}
 */
CommonUtil.isLoggedIn=function() {
    var u=localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_USERNAME];
    if (!u || u.length == 0 ) { return false; }
    var p=localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_PASSWORD];
    return !(!p || p.length == 0);
};


CommonUtil.showGeneralError = function () {
    $.ui.popup("<div class='heart icon'>Hubo un problema al recuperar los datos. Comprueba tu conexión a internet, o reinténtalo más tarde.</div>");
};
/*
 // This code essentially does what routing does in Backbone.js.
 // It takes the page destination and creates a view based on what
 // page the user is navigating to.
 $(document).bind("pagechange", function (event, data) {
 if (data.toPage[0] == pages.chatList[0]) {
 currentView = new ChatListView(event, data);
 } else if (data.toPage[0] == pages.delete[0]) {
 currentView = new DeleteChatView(event, data);
 } else if (data.toPage[0] == pages.chat[0]) {
 currentView = new ChatView(event, data);
 }
 });

 */

CommonUtil.arrayUnique = function(a) {
    return a.reduce(function(p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

/**
 * Changes the title.
 * @param iteration
 * @constructor
 */
function CommonUtilChangeTitle(iteration) {
    if (!iteration) { iteration=0; }
    if (iteration==200) { console.log("stopped. im tired of waiting the mistress"); return; }
    if (currentView instanceof ChatDetailCtl) {
        //console.log("changing title: "+currentView.getChatName());
        $.ui.setTitle(currentView.getChatName());
    } else {
        setTimeout(function() { CommonUtilChangeTitle(iteration+1) } ,100);
    }

}

CommonUtil.getLocalTime = function() {
    return new Date().getTime();
}

CommonUtil.formatTime = function (tstamp) {
    var d=new Date(tstamp);

    var hours   = d.getHours();
    var minutes = d.getMinutes();
    return hours+':'+((minutes<10)?("0"+minutes):minutes); //+':'+seconds;

}

/**
 * Function called when a message is received.
 * It is stored in localStorage, and then, paints whaetever needs to be painted
 * depending where i am.
 * FUture improvement throttling and limiting: throttling: http://stackoverflow.com/questions/18364918/throttling-pubnub-requests-in-angluarjs
 * (if too many messages received in little period)
 * @param message
 */
var globalOnMessageReceived = function(message) {

    console.log("Me llega mensaje!");

    message.receivedTime=CommonUtil.getLocalTime();
    //guardamos a local
    console.log(message);

    //If im in Chat Detail, then I will see the message. Else, it is unread
    if ((currentView instanceof ChatDetailCtl) && (currentView.chatId==message.channel)) {
        message.read=true;
    } else {
        message.unread=true;
    }

    messengerStorage.addMessage(message.channel,message,function() {
        //Lo mostramos:
        if (currentView instanceof ChatDetailCtl) {
            //si estoy en chatdetail, muestro el msg
            currentView.afterHandleMessage(message,true);
        } else if (currentView instanceof ChatListCtl) {
            //si estoy en chatlist, muestro el badge.
            currentView.afterHandleMessage(message);
        } else {

        }
    });
};

/**
 * Activates the queue
 * Makes sure there is not other query going on...
 * @param msecs
 */
CommonUtil.reactivateQueue = function(msecs) {
    console.log("Activating queue with ..."+msecs);
    if (msecs>0) {
        CommonUtil.CONSTANT.QUEUE_INTERVAL_RETRY=msecs;
    } else {
        CommonUtil.CONSTANT.QUEUE_INTERVAL_RETRY=1000;
    }
    //if (!CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER) {
        CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER = setTimeout(function() { globalRetrySendingMessages() }, CommonUtil.CONSTANT.QUEUE_INTERVAL_RETRY);
    //} else {
    //    console.log("already a timeout pointer");
    //    console.log(CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER);
    //}
}

var globalRetrySendingMessages = function() {
    console.log("Retry sending from queue... interval in msecs - "+CommonUtil.CONSTANT.QUEUE_INTERVAL_RETRY);
    var msg= messengerStorage.popMessage(CommonUtil.CONSTANT.QUEUE_RETRY_SEND_MSGS);
    if (msg) {
        console.log("Message to be sent found... ");
        messageService.publish(msg.channel,msg,
            function(m) {
                console.log("sent ok from queue");
                //And we mark it as sent in the view, if we are seeing the message
                if (currentView instanceof ChatDetailCtl) {
                    currentView.afterHandleMessage(msg,true);
                    currentView.markAsSentInView(msg);
                }
                //We delete the timeout if still there is another one over there (not sure if it will happen anytime...)
                CommonUtil.clearTimeoutPointer();
                globalRetrySendingMessages(); //i send next one
            },
            function(e) {
                console.log("sent error from the queue!");
                console.log(e);
                CommonUtil.addToFailedQueue(msg);
                //we retry in next time, giving a higher value not to repeat so many times
                CommonUtil.clearTimeoutPointer();
                CommonUtil.reactivateQueue(Math.min(CommonUtil.CONSTANT.QUEUE_INTERVAL_RETRY+500,CommonUtil.CONSTANT.QUEUE_MAX_INTERVAL_RETRY));

            }
        );

    }


    //
}

CommonUtil.clearTimeoutPointer = function() {
    if (CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER) { clearTimeout(CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER);  }
    CommonUtil.CONSTANT.QUEUE_TIMEOUT_POINTER=undefined;

}


/**
 * Add to failed query and activate query if not activated
 * @param message
 */
CommonUtil.addToFailedQueue = function(message) {
    messengerStorage.addMessage(CommonUtil.CONSTANT.QUEUE_RETRY_SEND_MSGS,message);

};

//console.log=function() { };