var RemoteData={};

/**
 * Calls DoLogin for the sphiral messenger app to the internet gateway.
 * Returns a call to callback function, passing an object with:
 *  ok: 1 OK, 0 error
 *  reason: 1 bad user / password, x other
 *  name: complete name
 * @param callback
 * @constructor
 */
RemoteData.DoLogin = function(callback) {
/*
    $.ajax( {
        url:"",
        success:function(data) {
            callback(true);
        },
        error:function(data) {
            callback(false);
        }
    });
*/
    setTimeout(function() { callback({ok: 1,name: "Jordi Marti"}) },2000);
    //after doing login, do callback
};

RemoteData.GetGroups = function(callback) {

    var groups=[
        { id: 12, description: "News from the company" }, //<span class='heart icon'>
        { id: 1, description: "Equipo Sphiral" },
        { id: 2, description: "Equipo ecommerce" },
        { id: 3, description: "Tecnología y Visión" },
        { id: 23, description: "Proyectos Business Inteligence" },
        { id:37, description: "Proyecto Karmacracy" },
        { id:24, description: "Let's have Fun" }
        ];

    //after doing login, do callback
    setTimeout(function() { callback(groups); },2000);
    
};

