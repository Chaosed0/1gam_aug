
define(['jquery', 'shared/Util', 'shared/Constants', 'shared/ConnectionUtil', 'shared/minivents',
        ], function($, u, c, connu, minivents) {

    var Comms = function() {
        var ws = null;
        var messageEvents = new minivents();
        var socketEvents = new minivents();

        this.bindMessage = function(type, func) {
            messageEvents.on(type, func);
        };

        this.unbindMessage = function(type, func) {
            messageEvents.off(type, func);
        };

        this.bindEvent = function(type, func) {
            socketEvents.on(type, func);
        }

        this.connect = function(url) {
            ws = new WebSocket(url);
            ws.onopen = onOpen;
            ws.onmessage = onReceive;
            ws.onerror = onError;
        };

        this.sendMessage = function(type, data) {
            u.assert(ws != null);
            var message = JSON.stringify(connu.constructMessage(type, data));
            console.log("SEND: " + message);
            ws.send(message);
        };

        var onOpen = function(openEvent) {
            socketEvents.emit('open', openEvent);
        }

        var onReceive = function(messageEvent) {
            console.log("RECV: " + messageEvent.data);
            var obj = JSON.parse(messageEvent.data);
            messageEvents.emit(obj.type, obj.data);
        };

        var onError = function(errorEvent) {
            socketEvents.emit('error', errorEvent);
        }
    };
    
    return Comms;
});
