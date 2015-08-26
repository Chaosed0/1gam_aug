
define(['ws', 'shared/minivents', 'shared/ConnectionUtil', 'shared/board'],
        function(WebSocket, minivents, connu, Board) {
    var Room = function() {
        var self = this;
        var players = {};
        var curPlayer = 0;
        
        var board = new Board();
        var eventer = new minivents();
        var idToMark = {};
        var nextId = 0;

        this.bind = function(type, func) {
            eventer.on(type, func);
        };

        this.handleMessage = function(message, gid) {
            var id = idToMark[gid];
            if (message.type == 'join_room') {
                onJoinRoom(id, message.room, message.name);
            } else if (message.type == 'place_mark') {
                onPlaceMark(id, message.position);
            }
        };

        this.playerJoined = function(gid, ws) {
            players[nextId] = {
                name: null,
                socket: ws
            };
            idToMark[gid] = nextId++;
        };

        this.playerLeft = function(ws) {
            for (var i = 0; i < players.length; i++) {
                if (players[i].socket == ws) {
                    delete players[i];
                    return;
                }
            }
        }

        this.isFull = function() {
            return players.length === 3;
        };

        this.isEmpty = function() {
            return players.length === 0;
        }

        var send = function(id, msg) {
            players[id].socket.send(JSON.stringify(msg));
        }

        var broadcast = function(msg) {
            for (id in players) {
                send(id, msg);
            }
        }

        var onJoinRoom = function(id, room, name) {
            var nameTaken = false;
            for (var id = 0; id < players.length; id++) {
                if (players[id].name == name) {
                    nameTaken = true;
                }
            }

            if (nameTaken) {
                send(id, connu.constructError(c.server_errors.NAME_TAKEN, "That name is already taken by someone in the room"));
                eventer.emit('leave_room', id);
            }

            console.log(id);
            players[id].name = name;
            send(id, connu.constructMessage('room_joined', { id: id }));
            for (var id = 0; id < players.length; id++) {
                broadcast(connu.constructMessage('player_joined', { id: id, name: players[id].name }));
            }

            if (self.isFull()) {
                broadcast('player_turn', { id: curPlayer });
            }
        }

        var onPlaceMark = function(id, position) {
            if (curPlayer != id) {
                send(connu.constructError(c.server_errors.NOT_YOUR_TURN, "It's not your turn!"));
                return;
            }
            if (!board.canPlaceMark(position)) {
                send(connu.constructError(c.server_errors.INVALID_COORDINATE, "Invalid placement"));
                return;
            }

            winInfo = board.placeMark(position, curPlayer);
            broadcast(connu.constructMessage('mark_placed', { id: curPlayer, position: position }));

            if (winInfo != null) {
                broadcast(connu.constructMessage('game_over', {
                    winner_id: playerId,
                    winning_marks: winInfo
                }));
                curPlayer = -1;
            } else {
                curPlayer = (curPlayer+1)%c.Marks.NONE;
                recvMessage('player_turn', { id: curPlayer });
            }
        }
    };

    return Room;
});
