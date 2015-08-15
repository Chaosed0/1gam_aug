
require(['jquery', './Util', './Constants', './board',
        ], function($, u, c, Board) {
    var canvas = $('#overlay');
    var context = canvas[0].getContext('2d');
    var tower = $('#tictactower');
    var imgrect = tower[0].getBoundingClientRect();
    var board = new Board();

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

    var highlightedCell = null;

    var getMousePos = function(canvas, event) {
        var rect = canvas[0].getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    canvas.mousemove(function(event) {
        var cell = board.getCellForPoint(getMousePos(canvas, event));
        if ((cell == null && highlightedCell != null) || cell != highlightedCell) {
            context.clearRect(0, 0, canvas[0].width, canvas[0].height);
        }
        
        if (cell != null && cell != highlightedCell) {
            context.beginPath();
            context.fillStyle = 'rgba(125,125,125,0.5)';
            context.lineWidth = 3;
            for (var i = 0; i < cell.length; i++) {
                if (i == 0) {
                    context.moveTo(cell[i].x, cell[i].y);
                } else {
                    context.lineTo(cell[i].x, cell[i].y);
                }
            }
            context.closePath();
            context.fill();
            context.stroke();
        }
        highlightedCell = cell;
    });
});
