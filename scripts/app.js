'use strict';

var currentView;

var init = function () {

    //$.ui.backButtonText = "Atr&aacute;s";// We override the back button text to always say "Back"
    //window.setTimeout(function () {
    $.ui.launch();
    //}, 1500);//We wait 1.5 seconds to call $.ui.launch after DOMContentLoaded fires



};
$.ui.ready(function() {

    console.log('Hello to the exclusive world of live!');
    $('#login').bind('loadpanel',function(/*e*/) {
        console.log('load panel login');
        currentView=new LoginCtl();
        currentView.execute();
    });

    $('#chatList').bind('loadpanel',function(/*e*/) {
        console.log('chatlist panel');
        currentView=new ChatListCtl();
        currentView.execute();

    });

    $('#chatDetail').bind('loadpanel',function(/*e*/) {
        console.log('load panel chatview');
        currentView=new ChatDetailCtl();
        currentView.execute();
    });

    $('#settings').bind('loadpanel',function(/*e*/) {
        console.log('load panel settings');
        currentView=new SettingsCtl();
        currentView.execute();
    });


    //First time, panel is not loaded, so we check if is logged in or not, and say what we load


    if (!CommonUtil.isLoggedIn()) {
        currentView=new LoginCtl();
        $.ui.loadContent("login",false,false,"none");
    } else {
        currentView=new ChatListCtl();
        $.ui.loadContent("chatList",false,false,"none");
        currentView.execute();
    }

    //Activate queue in case there is something in the queuing sending
    CommonUtil.reactivateQueue();

});

var messageService;
var messengerStorage;

$(document).ready(function() {
    messageService=new MessageService(); //we initialize the messageServive
    messengerStorage=new MessengerStorage(); //we initialize the messengerStorage

});
