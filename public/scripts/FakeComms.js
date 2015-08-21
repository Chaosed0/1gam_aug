
define(['jquery', './Util', './Constants', './minivents', './board',
        ], function($, u, c, minivents, Board) {

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

        var simulate_turns = true;

        if (!simulate_turns) {
            curPlayer = playerId;
        }

        var constructMessage = function(type, data) {
            return JSON.stringify({
                type: type,
                data: data
            });
        }

        var recvMessage = function(type, data) {
            var msg = constructMessage(type, data);
            console.log("RECV: " + msg);
            receiver.emit(type, data);
        }

        var recvGeneralError = function(msg) {
            recvMessage('error', {
                type: c.server_errors.GENERAL_ERROR,
                data: msg
            });
        }

        this.sendMessage = function(type, data) {
            var msg = constructMessage(type, data);
            console.log("SEND: " + msg);
            sender.emit(type, data);
        }

        this.bindMessage = function(type, func) {
            receiver.on(type, func);
        }

        this.unbindMessage = function(type, func) {
            receiver.off(type, func);
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
                recvGeneralError("It's not your turn!");
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
            }

            if (simulate_turns) {
                curPlayer = (curPlayer+1)%c.Marks.NONE;
                if (curPlayer != playerId) {
                    setTimeout(simulateTurn, 1000);
                }
            }

            recvMessage('player_turn', { id: curPlayer });
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
                recvGeneralError("join_room message received without room name");
                return;
            }
            if (data.name === undefined) {
                recvGeneralError("join_room message received without player name");
                return;
            }
            onJoinRoom(data.room, data.name);
        });

        sender.on('place_mark', function(data) {
            if (data.position === undefined) {
                recvGeneralError("place_mark message received without position data");
                return;
            }
            onPlaceMark(data.position);
        });
    };

    return FakeComms;
});
