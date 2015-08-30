
define(['shared/Util', 'shared/Constants', 'shared/ConnectionUtil', 'ws', 'https', 'appserver/Room'],
        function(u, c, connu, ws, https, Room) {

    var appserver = function(httpServer) {
        var rooms = [];
        var nameToRoom = {};
        var nextId = 0;

        console.log("Starting up websocket");
        var wss = new ws.Server({ server: httpServer });

        wss.on('connection', function(ws) {
            var id = nextId++;
            var roomId = null;

            console.log("Player ID " + id + " connected");

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
                    } else {
                        /* Room doesn't exist, create it */
                        rooms.push(new Room());
                        roomId = rooms.length-1;
                        nameToRoom[roomName] = roomId;
                        console.log("Created room " + roomName + " (" + roomId + ")");
                    }
                    rooms[roomId].playerJoined(id, ws);
                    rooms[roomId].bind('leave_room', checkLeftRoom);
                    console.log("Player ID " + id + " joined " + roomId);
                }

                /* Room exists, pass the message along */
                rooms[roomId].handleMessage(message, id);
            };

            ws.on('message', function(messageText) {
                handleMessage(messageText);
            });

            ws.on('close', function() {
                if(roomId != null) {
                    rooms[roomId].playerLeft(id, ws);
                    if (rooms[roomId].isEmpty()) {
                        delete rooms[roomId];
                        for (var roomName in nameToRoom) {
                            if (nameToRoom[roomName] == roomId) {
                                delete nameToRoom[roomName];
                            }
                        }
                    }
                }
            });
        });
    };

    return appserver;
});
