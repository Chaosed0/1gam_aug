
define(['jquery', './Util', './Constants', './tile_data'],
        function($, u, c, tile_data) {
    var Board = function() {
        var pointInCell = function(point, cell) {
            /* We're assuming two properties of the cells:
             *  1. They're ordered clockwise from the top-left
             *  2. The top and bottom lines are parallel (but not the left and right) */
            if (point.y < cell[0].y || point.y > cell[2].y) {
                return false;
            }

            var leftp1 = cell[0];
            var leftp2 = cell[3];
            var rightp1 = cell[1];
            var rightp2 = cell[2];

            var leftx = (leftp2.x - leftp1.x) / (leftp2.y - leftp1.y) * (point.y - leftp2.y) + leftp2.x;
            var rightx = (rightp2.x - rightp1.x) / (rightp2.y - rightp1.y) * (point.y - rightp2.y) + rightp2.x;

            if (point.x >= leftx && point.x <= rightx) {
                return true;
            }
            return false;
        }

        var offsetCell = function(cell, offset) {
            var newCell = new Array(cell.length);
            for (var i = 0; i < cell.length; i++) {
                newCell[i] = {};
                newCell[i].x = cell[i].x + offset.x;
                newCell[i].y = cell[i].y + offset.y;
            }
            return newCell;
        }

        this.getCellForPoint = function(point) {
            for (var i = 0; i < tile_data.origins.length; i++) {
                var origin = tile_data.origins[i];
                for (var j = 0; j < tile_data.tiles.length; j++) {
                    var tile = offsetCell(tile_data.tiles[j], origin);
                    if (pointInCell(point, tile)) {
                        return tile;
                    }
                }
            }
            return null;
        }
    }

    return Board;
});
