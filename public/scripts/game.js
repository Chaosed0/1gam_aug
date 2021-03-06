
require(['jquery', 'shared/Util', 'shared/Constants', './GraphicBoard', './FakeComms', './Comms',
        ], function($, u, c, GraphicBoard, FakeComms, Comms) {
    var canvas = $('#overlay');
    var context = canvas[0].getContext('2d');
    var tower = $('#tictactower');
    var imgrect = tower[0].getBoundingClientRect();
    var imgscale = imgrect.width / tower[0].naturalWidth;
    var board = new GraphicBoard({x: imgrect.left, y: imgrect.top}, imgscale);
    //var remoteUrl = "ws://127.0.0.1:46467/";
    var remoteUrl = "ws://45.37.125.236:46467/";

    var markSizes = [35 * imgscale, 60 * imgscale, 80 * imgscale];
    var markClasses = ['left', 'mid', 'right']
    var markSrcs = ['img/X.svg', 'img/O.svg', 'img/J.svg'];
    var allMarkClass = 'XOJ';

    var highlightedTile = null;
    var lastDownTile = null;

    var players = {};
    var numPlayers = 0;
    var yourId = -1;
    var name = 'lolwut';
    var yourTurn = false;
    var playerNameElem = $('#topText');
    var gameOverElem = $('#topText');

    //var CommsType = FakeComms;
    var CommsType = Comms;
    var serverErrorHandler = null;
    var comms = null;

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

    var refreshWaitingPlayers = function() {
        for (var id = 0; id < 3; id++) {
            if (id in players) {
                $('#waiting_playername_' + id).text(players[id].name);
            } else {
                $('#waiting_playername_' + id).text('');
            }
        }
    }

    var highlightTile = function(points, style) {
        if (style && style.fillStyle !== undefined) {
            context.fillStyle = style.fillStyle;
        } else {
            context.fillStyle = 'rgba(125,125,125,0.5)';
        }

        if (style && style.strokeStyle !== undefined) {
            context.strokeStyle = style.strokeStyle;
        } else {
            context.strokeStyle = '#000';
        }

        if (style && style.lineWidth !== undefined) {
            context.lineWidth = style.lineWidth;
        } else {
            context.lineWidth = 3;
        }

        context.beginPath();
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

    var hideModal = function() {
        $('#modal').hide();
    };

    var showDialog = function(dialog) {
        var modal = $('#modal');
        modal.show();
        modal.children('div').each(function() {
            if ($(this).attr('id') == dialog + '_dialog') {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

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

    var displayPlayer = function(id) {
        if (id != yourId) {
            playerNameElem.text(players[id].name + "'s turn");
        } else {
            playerNameElem.text("Your turn!");
        }
    };

    var gameOver = function(data) {
        var winner = players[data.winner_id];
        gameOverElem.text(winner.name + " wins!");
        for (var i = 0; i < data.winning_marks.length; i++) {
            var tile = board.getTileForCoord(data.winning_marks[i]);
            highlightTile(tile.getPoints(), { fillStyle: 'rgba(0,255,0,0.5)' });
        }
    };

    var putDownMark = function(tile, mark) {
        var coords = tile.getCoords();
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
        if (!yourTurn) {
            return;
        }

        var tile = board.getTileForPoint(getMousePos(canvas, event));
        if ((tile == null && highlightedTile != null) || tile != highlightedTile) {
            context.clearRect(0, 0, canvas[0].width, canvas[0].height);
        }

        if (tile != null && tile != highlightedTile) {
            var points = tile.getPoints();
            highlightTile(points);
        }
        highlightedTile = tile;
    });

    canvas.mousedown(function(event) {
        if (!yourTurn) {
            return;
        }

        var tile = board.getTileForPoint(getMousePos(canvas, event));
        lastDownTile = tile;
    });

    canvas.mouseup(function(event) {
        if (!yourTurn) {
            return;
        }

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
        var onGameStart = function() {
            var countdown = 3;
            var doCountdown = function() {
                if (countdown == 0) {
                    hideModal();
                    $('#waiting_message').text("Waiting for players...");
                    countdown = -1;
                } else {
                    $('#waiting_message').text("Starting game in " + countdown + " seconds");
                    countdown--;
                }

                if (countdown >= 0) {
                    window.setTimeout(doCountdown, 1000);
                }
            };
            doCountdown();
        }

        comms.bindMessage('room_joined', function(data) {
            u.assert(data.id !== undefined, "Didn't receive an ID from the server upon joining");
            yourId = data.id;
            players[data.id] = { name: name };

            showDialog('waiting');
            serverErrorHandler = alertErrorHandler;
        });

        comms.bindMessage('player_joined', function(data) {
            u.assert(data.id !== undefined, "A player joined, but the server didn't send their ID");
            players[data.id] = { name: data.name };
            refreshWaitingPlayers();
            numPlayers++;
            if (numPlayers >= 3) {
                onGameStart();
            }
        });

        comms.bindMessage('player_turn', function(data) {
            u.assert(data.id !== undefined, "A player's turn started, but the server didn't send their ID");
            if (data.id == yourId) {
                yourTurn = true;
            } else {
                yourTurn = false;
                context.clearRect(0, 0, canvas[0].width, canvas[0].height);
            }
            displayPlayer(data.id);
        });

        comms.bindMessage('mark_placed', function(data) {
            u.assert(data.id !== undefined, "A player placed a mark, but the server didn't send their ID");
            u.assert(data.position !== undefined, "A player placed a mark, but the server didn't send the position of the mark");
            putDownMark(board.getTileForCoord(data.position), data.id);
        });

        comms.bindMessage('game_over', function(data) {
            u.assert(data.winner_id !== undefined, "The game is over, but the server didn't send the ID of the player who won");
            u.assert(data.winning_marks !== undefined, "The game is over, but the server didn't send the winning positions");
            gameOver(data);
            yourTurn = false;
        });

        comms.bindMessage('player_left', function(data) {
            u.assert(data.id !== undefined, "A player left, but the server didn't tell us their ID");
            delete players[data.id];
            refreshWaitingPlayers();
            numPlayers--;
            if (numPlayers < 3) {
                showDialog('waiting');
            }
        });

        comms.bindMessage('board_state', function(data) {
            u.assert(data.state !== undefined, "Server sent us a board_state message without any state");
            u.assert(data.state.length == 24, "Server sent us a board state with length " + data.state.length);
            for (var i = 0; i < data.state.length; i++) {
                if (data.state[i] != c.Marks.NONE) {
                    putDownMark(board.getTileForId(i), data.state[i]);
                }
            }
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

        if (roomName == "local") {
            CommsType = FakeComms;
        }

        serverErrorHandler = loginErrorHandler;
        comms = new CommsType();
        comms.bindEvent('open', function() {
            bindToComms(comms);
            comms.sendMessage('join_room', { room: roomName, name: playerName });
        });
        comms.connect(remoteUrl);
    });
});
