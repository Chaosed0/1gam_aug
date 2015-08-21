
require(['jquery', './Util', './Constants', './GraphicBoard', './FakeComms',
        ], function($, u, c, GraphicBoard, FakeComms) {
    var canvas = $('#overlay');
    var context = canvas[0].getContext('2d');
    var tower = $('#tictactower');
    var imgrect = tower[0].getBoundingClientRect();
    var board = new GraphicBoard({x: imgrect.left, y: imgrect.top});

    var markSizes = [35, 60, 80];
    var markClasses = ['left', 'mid', 'right']
    var markSrcs = ['img/X.svg', 'img/O.svg', 'img/J.svg'];
    var allMarkClass = 'XOJ';

    var highlightedTile = null;
    var lastDownTile = null;

    var players = {};
    var yourId = -1;
    var name = 'lolwut';
    var yourTurn = false;

    var CommsType = FakeComms;
    var serverErrorHandler = null;
    var comms = null;

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

    var hideModal = function() {
        $('#modal').hide();
    };

    var getAlertMsg = function(data) {
        var msg = null;
        switch(data.type) {
            case c.server_errors.ROOM_FULL:
                msg = "Room is full";
                break;
            case c.server_errors.NAME_TAKEN:
                msg = "That name is taken";
                break;
            case c.server_errors.INVALID_COORDINATE:
                msg = "You can't put a piece there";
                break;
            case c.server_errors.GENERAL_ERROR:
            default:
                msg = data.data;
                break;
        }
        return msg;
    }

    var alertErrorHandler = function(msg) {
        alert(msg);
    }

    var loginErrorHandler = function(msg) {
        $('#login_error').text(msg);
    }

    var getMousePos = function(canvas, event) {
        var rect = canvas[0].getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    var putDownMark = function(tile, mark) {
        var coords = tile.getCoords();
        console.log(coords);
        var markSize = markSizes[coords.x];
        var markClass = markClasses[coords.z];
        var markSrc = markSrcs[mark];

        var tileCenter = {x: 0, y: 0};
        var tilePoints = tile.getPoints();
        for (var i = 0; i < tilePoints.length; i++) {
            tileCenter.x += tilePoints[i].x;
            tileCenter.y += tilePoints[i].y;
        }
        tileCenter.x /= tilePoints.length;
        tileCenter.y /= tilePoints.length;

        var markElem = $('<img/>');
        markElem.addClass(allMarkClass);
        markElem.addClass(markClass);
        markElem.attr('width', markSize);
        markElem.attr('height', markSize);
        markElem.attr('src', markSrc);

        $('body').append(markElem);
        var bounds = markElem[0].getBoundingClientRect();
        markElem.css('left', Math.floor(tileCenter.x - markSize / 2));
        markElem.css('top', Math.floor(tileCenter.y - markSize / 2));
    };

    canvas.mousemove(function(event) {
        var tile = board.getTileForPoint(getMousePos(canvas, event));
        if ((tile == null && highlightedTile != null) || tile != highlightedTile) {
            context.clearRect(0, 0, canvas[0].width, canvas[0].height);
        }

        if (tile != null && tile != highlightedTile) {
            var points = tile.getPoints();
            context.beginPath();
            context.fillStyle = 'rgba(125,125,125,0.5)';
            context.lineWidth = 3;
            for (var i = 0; i < points.length; i++) {
                if (i == 0) {
                    context.moveTo(points[i].x, points[i].y);
                } else {
                    context.lineTo(points[i].x, points[i].y);
                }
            }
            context.closePath();
            context.fill();
            context.stroke();
        }
        highlightedTile = tile;
    });

    canvas.mousedown(function(event) {
        var tile = board.getTileForPoint(getMousePos(canvas, event));
        lastDownTile = tile;
    });

    canvas.mouseup(function(event) {
        var tile = board.getTileForPoint(getMousePos(canvas, event));
        if (tile == null) {
            lastDownTile = null;
            return;
        }

        if (lastDownTile == tile && yourTurn) {
            comms.sendMessage('place_mark', { position: tile.getCoords() });
        }

        lastDownTile = null;
    });

    var bindToComms = function(comms) {
        comms.bindMessage('room_joined', function(data) {
            u.assert(data.id !== undefined, "Didn't receive an ID from the server upon joining");
            yourId = data.id;
            players[data.id] = { name: name };
        });

        comms.bindMessage('player_joined', function(data) {
            u.assert(data.id !== undefined, "A player joined, but the server didn't send their ID");
            players[data.id] = { name: data.name };
        });

        comms.bindMessage('player_turn', function(data) {
            u.assert(data.id !== undefined, "A player's turn started, but the server didn't send their ID");
            if (data.id == yourId) {
                yourTurn = true;
            } else {
                yourTurn = false;
            }
        });

        comms.bindMessage('mark_placed', function(data) {
            u.assert(data.id !== undefined, "A player placed a mark, but the server didn't send their ID");
            u.assert(data.position !== undefined, "A player placed a mark, but the server didn't send the position of the mark");
            putDownMark(board.getTileForCoord(data.position), data.id);
        });

        comms.bindMessage('game_over', function(data) {
            u.assert(data.winner_id !== undefined, "The game is over, but the server didn't send the ID of the player who won");
            u.assert(data.winning_marks !== undefined, "The game is over, but the server didn't send the winning positions");
            $('body').append("<p>Game Over</p>");
            yourTurn = false;
        });

        comms.bindMessage('player_left', function(data) {
            u.assert(data.id !== undefined, "A player left, but the server didn't tell us their ID");
            //empty for now
        });

        comms.bindMessage('error', function(data) {
            var msg = getAlertMsg(data);
            if (msg != null && msg !== undefined) {
                serverErrorHandler(msg);
            }
        });
    };

    $('#join_button').click(function() {
        var playerName = $('#name_input').val();
        var roomName = $('#room_input').val();

        serverErrorHandler = loginErrorHandler;
        comms = new CommsType();
        bindToComms(comms);

        var onJoinRoom = function() {
            hideModal();
            serverErrorHandler = alertErrorHandler;
            comms.unbindMessage('player_joined', onJoinRoom);
        }

        comms.bindMessage('player_joined', onJoinRoom);
        comms.sendMessage('join_room', { room: roomName, name: playerName });
    });
});
