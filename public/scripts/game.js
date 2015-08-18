
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

    var comms = new FakeComms();

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

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

    comms.bindMessage('room_joined', function(data) {
        yourId = data.id;
        players[data.id] = { name: name };
    });

    comms.bindMessage('player_joined', function(data) {
        players[data.id] = { name: data.name };
    });

    comms.bindMessage('player_turn', function(data) {
        if (data.id == yourId) {
            yourTurn = true;
        } else {
            yourTurn = false;
        }
    });

    comms.bindMessage('mark_placed', function(data) {
        putDownMark(board.getTileForCoord(data.position), data.id);
    });

    comms.bindMessage('game_over', function(data) {
        $('body').append("<p>Game Over</p>");
        yourTurn = false;
    });

    comms.bindMessage('player_left', function(data) {
        //empty for now
    });

    comms.bindMessage('error', function(data) {
        var alertMsg = null;
        switch(data.type) {
            case c.server_errors.ROOM_FULL:
                alertMsg = "Room is full";
                break;
            case c.server_errors.NAME_TAKEN:
                alertMsg = "That name is taken";
                break;
            case c.server_errors.INVALID_COORDINATE:
                alertMsg = "You can't put a piece there";
                break;
            case c.server_errors.GENERAL_ERROR:
                alertMsg = data.data;
                break;
        }

        if (alertMsg != null) {
            alert(alertMsg);
        }
    });

    comms.sendMessage('join_room', { room: 'asdg', name: name });
});
