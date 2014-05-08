'use strict';

var SettingsCtl = function() {

};

SettingsCtl.prototype.execute = function() {
    console.log('settingsctl:execute');

    this.bindElements();

};

SettingsCtl.prototype.bindElements = function() {
    console.log('bind elements settings');
    $('#settingsClose').unbind('tap');
    $('#settingsClose').bind('tap',function(e) {
        console.log('settings close');
        localStorage.clear();
        $.ui.loadContent("login");
    });
}
