
define(['jquery', 'shared/Util', 'shared/Constants', 'shared/ConnectionUtil', 'shared/minivents', 'shared/Board',
        ], function($, u, c, connu, minivents, Board) {

    var FakeComms = function() {
        var self = this;
        var playerId = 2;
        var curPlayer = 0;
        var players = [
            { name: 'guy' },
            { name: 'person' }
        ];
        
        var board = new Board();

        var sender = new minivents();
        var receiver = new minivents();
        var events = new minivents();

        var simulate_turns = true;

        if (!simulate_turns) {
            curPlayer = playerId;
        }

        var recvMessage = function(type, data) {
            var msg;
            if (data === undefined) {
                msg = type;
            } else {
                msg = connu.constructMessage(type, data);
            }
            console.log("RECV: " + JSON.stringify(msg));
            receiver.emit(type, data);
        }

        this.connect = function(url) {
            events.emit('open');
        }

        this.sendMessage = function(type, data) {
            var msg;
            if (data === undefined) {
                msg = type;
            } else {
                msg = connu.constructMessage(type, data);
            }
            console.log("SEND: " + JSON.stringify(msg));
            var validation_error = connu.validateMessage(msg);
            if (validation_error !== null) {
                recvMessage(connu.constructGeneralError(validation_error));
            } else {
                sender.emit(type, data);
            }
        }

        this.bindMessage = function(type, func) {
            receiver.on(type, func);
        }

        this.unbindMessage = function(type, func) {
            receiver.off(type, func);
        }

        this.bindEvent = function(type, func) {
            events.on(type, func);
        }

        this.unbindEvent = function(type, func) {
            events.off(type, func);
        }

        var onJoinRoom = function(room, name) {
            var nameTaken = false;
            for (var id = 0; id < players.length; id++) {
                if (players[id].name == name) {
                    nameTaken = true;
                }
            }

            if (nameTaken) {
                recvMessage('error', { 'type': c.server_errors.NAME_TAKEN });
                return;
            }

            players.push({ name: name });
            recvMessage('room_joined', { id: playerId });
            for (var id = 0; id < players.length; id++) {
                recvMessage('player_joined', { id: id, name: players[id].name });
            }

            recvMessage('player_turn', { id: curPlayer });
            if (curPlayer != playerId) {
                setTimeout(simulateTurn, 1000);
            }
        }

        var onPlaceMark = function(position) {
            if (!board.canPlaceMark(position)) {
                recvMessage('error', { 'type': c.server_errors.INVALID_COORDINATE });
                return;
            }
            if (curPlayer != playerId) {
                recvMessage(connu.constructGeneralError("It's not your turn!"));
            }
            placeMark(position);
        }

        var placeMark = function(position) {
            winInfo = board.placeMark(position, curPlayer);

            recvMessage('mark_placed', { id: curPlayer, position: position });

            if (winInfo != null) {
                recvMessage('game_over', {
                    winner_id: playerId,
                    winning_marks: winInfo
                });
                curPlayer = -1;
                simulate_turns = false;
            } else {
                if (simulate_turns) {
                    curPlayer = (curPlayer+1)%c.Marks.NONE;
                    if (curPlayer != playerId) {
                        setTimeout(simulateTurn, 1000);
                    }
                }

                recvMessage('player_turn', { id: curPlayer });
            }
        }

        var simulateTurn = function() {
            var markPlaced = false;
            while (!markPlaced) {
                var tile = Math.floor(u.getRandom(0, 8));
                position = {
                    x: tile < 5 ? Math.floor(tile / 3) : 2,
                    y: Math.floor(u.getRandom(0, 3)),
                    z: (tile < 4 ? tile % 3 : (tile == 4 ? 2 : tile-5))
                }
                if (board.canPlaceMark(position)) {
                    markPlaced = true;
                    placeMark(position);
                }
            }
        }

        sender.on('join_room', function(data) {
            if (data.room === undefined) {
                recvMessage(connu.constructGeneralError("join_room message received without room name"));
                return;
            }
            if (data.name === undefined) {
                recvMessage(connu.constructGeneralError("join_room message received without player name"));
                return;
            }
            onJoinRoom(data.room, data.name);
        });

        sender.on('place_mark', function(data) {
            onPlaceMark(data.position);
        });
    };

    return FakeComms;
});
