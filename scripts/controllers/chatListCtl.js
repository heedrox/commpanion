'use strict';


function ChatListCtl() {


}

ChatListCtl.prototype.execute = function() {

    console.log('chatlist:execute');
    //console.log(localStorage);
    var u=CommonUtil.getLoggedUsername();
    if (!u || u.length==0) {
        console.log("Not logged in");
        console.log(localStorage);

        this.backToLogin();
        return;
    }

    //if we are not connected, connect.
    messageService.connect(u);

    this.fillGroups();
    this.bindElements();

};

ChatListCtl.prototype.fillGroups = function() {
    //First, get groups that are in local.
    var that=this;
    messengerStorage.getLocalGroups(function(groups) {
        if (!groups || groups.length==0) {
            //if no groups are in local, reload them (with uimask).
            that.reloadGroupsFromRemote(true,function(groups) {
                //when it's finished reloading groups, then repaint.
                that.subscribe(groups);
                that.repaintGroups(groups);
            });

        } else {
            that.subscribe(groups);
            //if groups exist, repaint
            that.repaintGroups(groups);

            //reload them for the future, but in background
            //only if there is any change in any group
            //this could be fixed to do better (only change the one that changes)
            var groupsb4=groups;
            that.reloadGroupsFromRemote(false,function(grs) {
                var needtopaint=false;
                if (groupsb4.length == grs.length) {
                    for (var n=0;n<groupsb4.length;n++) {
                        if (JSON.stringify(groupsb4[n])!=JSON.stringify(grs[n])) {
                            needtopaint=true;
                        }
                    }
                } else {
                    needtopaint=true;
                }
                if (needtopaint) {
                    that.repaintGroups(grs);
                }
            });
        }
    });
};

ChatListCtl.prototype.bindElements = function() {
    var that=this;
    var mbr=$('#menubadgeRefresh');
    mbr.unbind('tap');
    mbr.bind("tap",function(/*e*/) {
        that.reloadGroupsFromRemote(true,function(groups) {
            //when it's finished reloading groups, then repaint.
            that.repaintGroups(groups);
        });
    });
};

/**
 * Reloads groups from ajax remote.
 * Shows mask
 * When done, then saves groups and returns back the groups to the fnCallback
 */
ChatListCtl.prototype.reloadGroupsFromRemote = function(showMask,fnCallback) {
    if (showMask) {
        $.ui.showMask();
    }
    var that=this;
    RemoteData.GetGroups(function(groups) {
        //Tengo los grupos.
        messengerStorage.setLocalGroups(groups);
        if (showMask) {
            $.ui.hideMask();
        }
        fnCallback(groups);
    });
};

/**
 * Repaint groups
 * @param groups
 */
ChatListCtl.prototype.repaintGroups = function(groups) {
    if (!groups || groups.length==0) {
        //show "no hay grupo!"
        //nothing to do, we keep the cool "nogroup" page at the beginning
    } else {
        //show groups
        var tmp='<ul class="list">';
        groups.forEach(function (group) {
            // group.id + group.description + group.unread.
            tmp+="<li id='chatlistitem-"+encodeURIComponent(group.id)+"'><a href='#"+"chatDetail/"+encodeURIComponent(group.id)+"' data-msgr-chat-id='"+encodeURIComponent(group.id)+"' data-transition='none'>"+group.description+"</a></li>";
        });
        tmp+="</tmp>";
        //console.log(tmp);
        var cl=$('#chatList');
        //$.ui.updateBadge("id",'3','bl','green')
        cl.empty();
        cl.append(tmp);

        groups.forEach(function (group) {
            messengerStorage.getMessages(group.id,function(messages) {
                var unreadmes=messages.filter(function(x) {
                    return x.unread==true;
                });
                var numunread=Number(unreadmes.length);
                console.log("chatlistitem-"+encodeURIComponent(group.id)+" - "+ numunread);
                if (numunread>0) {
                    $.ui.updateBadge("#chatlistitem-"+encodeURIComponent(group.id)+" a",numunread,'br','#690');
                    $("#chatlistitem-"+encodeURIComponent(group.id)+" a").addClass("unread");
                    //$("[data-channel-name='"+chat+"']").append(bhtml);
                }
            });
        });
    }


};

/**
 * Subscribes to the groups to the messageService.
 * In this case, if already subscribed, it doesnt do anything,
 * @param groups
 */
ChatListCtl.prototype.subscribe = function(groups) {
    var that=this;
    groups.forEach(function (g) {
        messageService.subscribe(g.id,globalOnMessageReceived);
    });

};
ChatListCtl.prototype.backToLogin = function() {
    $.ui.loadContent("login",false,false,"none");
};


/**
 * After receiving a message in this list, we should repaint the list.
 * @param message
 */
ChatListCtl.prototype.afterHandleMessage = function (message) {
    // This repaints the groups
    //TODO check i have access to this channel (that it is in my channel list)
    var that=this;
    if (message.channel!=undefined) {
        //reload groups
        messengerStorage.getLocalGroups(function(groups) {
            that.repaintGroups(groups);
        });
    }

};