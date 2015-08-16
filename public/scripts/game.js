
require(['jquery', './Util', './Constants', './board', './Tile',
        ], function($, u, c, Board, Tile) {
    var canvas = $('#overlay');
    var context = canvas[0].getContext('2d');
    var tower = $('#tictactower');
    var imgrect = tower[0].getBoundingClientRect();
    var board = new Board({x: imgrect.left, y: imgrect.top});

    var markSizes = [35, 60, 80];
    var markClasses = ['left', 'mid', 'right']
    var markSrcs = [null, 'img/X.svg', 'img/O.svg', 'img/J.svg'];
    var allMarkClass = 'XOJ';

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

    var highlightedTile = null;
    var lastDownTile = null;
    var mark = Tile.Marks.X;

    var getMousePos = function(canvas, event) {
        var rect = canvas[0].getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    var putDownMark = function(tile, mark) {
        var coords = tile.getCoords();
        var markSize = markSizes[coords.z];
        var markClass = markClasses[coords.x];
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

        tile.setMark(mark);
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

        if (lastDownTile == tile && tile.getMark() == Tile.Marks.NONE) {
            putDownMark(tile, mark);
        }

        mark++;
        if (mark >= Tile.Marks.LENGTH) {
            mark = Tile.Marks.X;
        }

        lastDownTile = null;
    });
});
