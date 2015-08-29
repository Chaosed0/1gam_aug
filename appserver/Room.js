
define(['ws', 'shared/Util', 'shared/Constants', 'shared/minivents', 'shared/ConnectionUtil', 'shared/board'],
        function(WebSocket, u, c, minivents, connu, Board) {
    var Room = function() {
        var self = this;
        var players = {};
        var numPlayers = 0;
        var curPlayer = 0;
        
        var board = new Board();
        var eventer = new minivents();
        var gidToId = {};
        var nextId = 0;

        this.bind = function(type, func) {
            eventer.on(type, func);
        };

        this.handleMessage = function(message, gid) {
            var id = gidToId[gid];
            var data = message.data;
            if (message.type == 'join_room') {
                onJoinRoom(id, data.room, data.name);
            } else if (message.type == 'place_mark') {
                onPlaceMark(id, data.position);
            }
        };

        this.playerJoined = function(gid, ws) {
            players[nextId] = {
                name: null,
                socket: ws
            };
            gidToId[gid] = nextId;
            nextId++;
        };

        this.playerLeft = function(gid, ws) {
            var id = gidToId[gid];
            if (id in players) {
                delete players[id];
                numPlayers--;
            } else {
                console.log("ERROR: bad id " + id + " passed to playerLeft!");
            }
        }

        this.isFull = function() {
            return numPlayers === 3;
        };

        this.isEmpty = function() {
            return numPlayers === 0;
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
            for (var oid = 0; oid < players.length; oid++) {
                if (players[oid].name == name) {
                    nameTaken = true;
                }
            }
            console.log(id, name);

            if (nameTaken) {
                send(id, connu.constructError(c.server_errors.NAME_TAKEN, "That name is already taken by someone in the room"));
                eventer.emit('leave_room', id);
                return;
            }

            players[id].name = name;
            send(id, connu.constructMessage('room_joined', { id: id }));
            for (var oid in players) {
                if (oid != id) {
                    send(id, connu.constructMessage('player_joined', { id: oid, name: players[oid].name }));
                }
            }
            broadcast(connu.constructMessage('player_joined', {id: id, name: players[id].name}));

            numPlayers++;
            if (self.isFull()) {
                broadcast(connu.constructMessage('player_turn', { id: curPlayer }));
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
                    winner_id: curPlayer,
                    winning_marks: winInfo
                }));
                curPlayer = -1;
            } else {
                curPlayer = (curPlayer+1)%c.Marks.NONE;
                broadcast(connu.constructMessage('player_turn', { id: curPlayer }));
            }
        }
    };

    return Room;
});
