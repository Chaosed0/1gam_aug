
require(['shared/Constants', 'ws'], function(c, ws) {
    var rooms = [];
    var nameToRoom = {};

    var wss = new ws.Server({port: 46467 });

    wss.on('connection', function(ws) {
        var id = nextId;
        var room = null;

        ws.on('message', handleMessage);
    });

    var handleMessage = function(messageText) {
        var message;
        try {
            message = JSON.parse(messageText);
        } catch(exc) {
            return {
                type: c.server_errors.GENERAL_ERROR,
                error: "Error parsing JSON message"
            };
        }

        var validation_error = validateMessage(message);
        if (validation_error != null) {
            return 
        }

        if (room == null) {
            /* The only thing allowed to be sent when the player hasn't
             * joined a room is join_room */
            if (message.type != 'join_room') {
                ws.send(JSON.stringify({
                    type: c.server_errors.GENERAL_ERROR,
                    error: "You are not in a room yet!"
                }));
                return;
            }

            /* Check if the room exists */
            if (message.room in nameToRoom) {
                /* Check if the room is full */
                if (nameToRoom[message.room].isFull()) {
                    ws.send(JSON.stringify({
                    }));
                }
            }
        }
    };
});
