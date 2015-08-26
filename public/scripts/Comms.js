
define(['jquery', 'shared/Util', 'shared/Constants', 'shared/ConnectionUtil', 'shared/minivents',
        ], function($, u, c, connu, minivents) {

    var Comms = function() {
        var ws = null;
        var eventer = new minivents();

        this.bindMessage = function(type, func) {
            eventer.on(type, func);
        };

        this.connect = function(url, onConnect) {
            ws = new WebSocket(url);
            ws.onopen = onConnect;
            ws.onmessage = onReceive;
            ws.onerror = onError;
        };

        this.sendMessage = function(type, data) {
            u.assert(ws != null);
            var message = JSON.stringify(connu.constructMessage(type, data));
            console.log("SEND: " + message);
            ws.send(message);
        };

        var onReceive = function(message) {
            console.log("RECV: " + message.data);
            var obj = JSON.parse(message.data);
            eventer.on(obj.type, obj.data);
        };

        var onError = function(error) {
            alert(error);
        }
    };
    
    return Comms;
});
