
require(['shared/Util', 'shared/Constants', 'shared/ConnectionUtil', 'ws', 'appserver/Room'],
        function(u, c, connu, ws, Room) {
    var rooms = [];
    var roomSockets = [];
    var nameToRoom = {};
    var nextId = 0;

    var wss = new ws.Server({port: 46467 });

    wss.on('connection', function(ws) {
        var id = nextId++;
        var roomId = null;

        var send = function(msg) {
            ws.send(JSON.stringify(msg));
        };

        var checkLeftRoom = function(playerId) {
            u.assert(roomId != null);
            if (playerId == id) {
                rooms[roomId].off('leave_room', checkLeftRoom);
                roomId = null;
            };
        }

        var handleMessage = function(messageText) {
            var message;
            try {
                message = JSON.parse(messageText);
            } catch(exc) {
                send(connu.constructError(c.server_errors.PARSE_ERROR, "Error parsing JSON message"));
            }

            var validation_error = connu.validateMessage(message);
            if (validation_error != null) {
                send(onnu.constructError(c.server_errors.INVALID_MESSAGE, validation_error));
            }

            if (roomId == null) {
                /* The only thing allowed to be sent when the player hasn't
                 * joined a room is join_room */
                if (message.type != 'join_room') {
                    send(connu.constructError(c.server_errors.INVALID_MESSAGE, "You are not in a room yet!"));
                }

                /* Check if the room exists */
                var roomName = message.data.room;
                if (roomName in nameToRoom) {
                    roomId = nameToRoom[roomName];
                    /* Check if the room is full */
                    if (rooms[roomId].isFull()) {
                        roomId = null;
                        send(connu.constructError(c.server_errors.ROOM_FULL, "The room is full"));
                    }
                } else {
                    /* Room doesn't exist, create it */
                    rooms.push(new Room());
                    roomId = rooms.length-1;
                    nameToRoom[roomName] = roomId;
                }
                rooms[roomId].playerJoined(id, ws);
                rooms[roomId].bind('leave_room', checkLeftRoom);
            }

            /* Room exists, pass the message along */
            rooms[roomId].handleMessage(message, id);
        };

        ws.on('message', function(messageText) {
            handleMessage(messageText);
        });

        ws.on('close', function() {
            if(roomId != null) {
                rooms[roomId].playerLeft(ws);
                if (rooms[roomId].isEmpty()) {
                    delete rooms[roomId];
                }
            }
        });
    });
});
