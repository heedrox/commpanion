'use strict';

var LoginCtl = function() {

};


LoginCtl.prototype.execute = function() {
    console.log('loginctl:execute');

    $.ui.clearHistory();

    this.bindElements();
    this.fillElements();
};

LoginCtl.prototype.bindElements = function() {
    var that=this;
    $('#loginBtn').unbind('tap');
    $('#loginBtn').bind('tap',function(e) {
        that.goSubmit();
    });
    $('#loginForm').unbind('submit');
    $('#loginForm').bind('submit',function(e) {
        that.goSubmit();
    });
}

LoginCtl.prototype.fillElements=function() {
    $('#username').focus();
    if (localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_USERNAME]) {
        $('#username').val(localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_USERNAME]);
    }
    if (localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_PASSWORD]) {
        $('#password').val(localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_PASSWORD]);
    }

}

LoginCtl.prototype.goSubmit = function() {
    //check data ok.
    if ($('#username').val().trim()=="" || $('#password').val().trim()=="") {
        $.ui.popup({ title:"Aviso",message: "Debes introducir todos tus datos" ,cancelOnly:true,cancelText:"Entendido"});

        return;
    }


    $.ui.showMask();
   RemoteData.DoLogin(function(result) {
       $.ui.hideMask();
       console.log(result);
      if (result.ok==1) {
          //go
          localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_USERNAME]=$('#username').val();
          localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_PASSWORD]=$('#password').val();
          localStorage[CommonUtil.CONSTANT.LOCALSTORAGE_COMPLETENAME]=result.name;
          $.ui.loadContent("chatList",false,false,"slideup");
          $.ui.clearHistory();
      } else if (result.reason==1) {
          $.ui.popup("Comprueba las credenciales introducidas, parece que no son correctas.");
      } else {
          CommonUtil.showGeneralError();
      }
   });

}

