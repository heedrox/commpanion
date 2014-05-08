"use strict";

/////
// Chatting View
//////
function ChatDetailCtl() {
    //Variables: this.chatId
    this.chatId=-1;

    var tmpdata=location.hash.split("/");
    if (tmpdata.length>1) {
        this.chatId=tmpdata[tmpdata.length-1];
    } else {
        $.ui.back();
    }

    //console.log($('#chatlistitem-'+encodeURIComponent(this.chatId)).html());
    var node=$('#chatlistitem-'+encodeURIComponent(this.chatId)).clone();
    $('span',node).remove();
    this.chatName=node.text();

}

ChatDetailCtl.prototype.getChatName = function() {
    return this.chatName;
};

ChatDetailCtl.prototype.execute = function() {

    console.log("chatDetail execute: "+this.chatId);
    //console.log(this.chatName);

    //Show menu options
    $('.showinChat').show();

    this.loadMessages();
    this.bindElements();


};

/**
 * Bind elements. In this case:
 * - send message button
 * - message chat input text
 */
ChatDetailCtl.prototype.bindElements= function() {
    var sendMessageButton=$('#sendChatMessageBtn');
    var messageContent=$('#chatMessageContent');
    var emptyChatMenu=$('#emptyChatMenu');

    var that=this;

    emptyChatMenu.unbind('tap');
    emptyChatMenu.bind("tap",function(/*e*/) {
       messengerStorage.emptyGroup(that.chatId,function() {
           $('#chatDetailList').empty();
       });
    });

    messageContent.unbind('keydown');
    messageContent.bind('keydown', function (event) {
        if((event.keyCode || event.charCode) !== 13) return true;
        sendMessageButton.trigger("tap");
        return false;
    });
    messageContent.focus();


    sendMessageButton.unbind('tap');
    sendMessageButton.bind("tap",function (/*e*/) {
        var message = messageContent.val().trim();
        if(message !== "") {
            messageContent.val("");
            var msg={
                channel:  that.chatId,
                username: CommonUtil.getLoggedUsername(),
                realname: CommonUtil.getLoggedCompleteName(),
                text: message,
                sentTime : new Date().getTime()
            };
            //I add the msg to the list (in pending or busy mode)
            that.addMessagesToView([msg],true);
            //I publish it to the service
            messageService.publish(that.chatId,msg,
                function(/*m*/) {
                    console.log("sent ok");
                    that.markAsSentInView(msg);
                },
                function(e) {
                    console.log("sent error!");
                    console.log(e);
                    CommonUtil.addToFailedQueue(msg);
                    CommonUtil.reactivateQueue(0); //if its not working, then activate the queue timeout
                }
            );

        }
    });


};

/**
 * Show last messages when opening the panel
 */
ChatDetailCtl.prototype.loadMessages= function() {

    var cv=this;
    messengerStorage.getMessages(this.chatId,function(messages) {
        console.log("Refresh messages from local: "+messages.length);
        $('#chatDetailList').empty();
        cv.addMessagesToView(messages, false);
        setTimeout(function() {
            $.ui.scrollToBottom('chatDetail',0);
        },1);
        messengerStorage.markMessagesRead(cv.chatId);
    });
};

/**
 * Adds the message to the view. Gets the html thanks to getMessageLiHtml.
 * DOES NOT add the message to the Storage service.
 * @param messages
 * @param animate
 */
ChatDetailCtl.prototype.addMessagesToView = function(messages,animate) {
    var txt="";
    var that=this;
    messages.forEach(function(message) {
        txt+=that.getMessageLiHtml(message);
    });

    if (txt!="") {
        var messageList=$('#chatDetailList');
        messageList.append(txt);

        // Scroll to bottom of page
        if (animate === true) {
            $.ui.scrollToBottom('chatDetail');
        }
    }

};

ChatDetailCtl.prototype.getMessageLiHtml = function(message) {
    var txt="<li id='msg"+encodeURIComponent(message.username+"-"+message.sentTime)+"' class='message "+((message.username == CommonUtil.getLoggedUsername())?"minemsg":"othermsg")+"'>"
        + "<span class='realname'><span class='name'>" + message.realname + "</span>";
    if (message.receivedTime) {
        txt=txt+ "<span class='time'> / "+CommonUtil.formatTime(message.receivedTime)+"</span>"
    } else {
        txt=txt+ "<span class='time'></span>";
        txt=txt+ "<span class='icon busy'></span>";
    }
    txt=txt+"</span>"+message.text+ "</li>";
    return txt;
};

ChatDetailCtl.prototype.markAsSentInView = function(message) {
    var mid="msg"+encodeURIComponent(message.username+"-"+message.sentTime);
    var busyicon=$('#'+mid+" .busy");
    if (busyicon.length>0) {
        busyicon.remove();
        $('#'+mid+" .time").html(" / "+CommonUtil.formatTime(new Date().getTime()));
    } else {
        //there was not message to mark as sent. I do it this way in case it was already sent
        //but not painted, so the real time is maintained.

    }

};



// This appends the message to the list
ChatDetailCtl.prototype.afterHandleMessage = function (message, animate) {
    if (animate !== false) animate = true;

    //If it is a message from me, then ignore, because it has been added before
    if (message.username!=CommonUtil.getLoggedUsername()) {
        //We check if that message is already in my list, so we dont paint it again...
        var doPaintIt=true;
        console.log(message.channel);
        console.log(this.chatId);
        if (message.channel != this.chatId) {
            doPaintIt=false;

        } else if (message.sentTime) {
            var mid="msg"+encodeURIComponent(message.username+"-"+message.sentTime);
            if ($('#'+mid).length>0) {
                doPaintIt=false; //if it already exists, do not paint it.
            }
        }
        if (doPaintIt) {
            var messageList=$('#chatDetailList');
            var txt=this.getMessageLiHtml(message);
            messageList.append(txt);

        }

    } else {
        //mark as sent in view in case it was still without sending
        this.markAsSentInView(message);
    }

    // Scroll to bottom of page
    if (animate === true) {
        //$("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 'slow');
        $.ui.scrollToBottom('chatDetail');
    }


};

/**
 * Hides the side menu options that are only for chat detail
 * It is called from the index.html place
 * @constructor
 */
function ChatDetailUnloadPanel() {
    $('.showinChat').hide();
}