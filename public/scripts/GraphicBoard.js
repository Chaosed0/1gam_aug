
define(['jquery', './Util', './Constants', './tile_data'],
        function($, u, c, tile_data) {

    var Tile = function(points, coords) {
        this.containsPoint = function(point) {
            /* We're assuming two properties of points:
             *  1. They're ordered clockwise from the top-left
             *  2. The top and bottom lines are parallel (but not the left and right) */
            if (point.y < points[0].y || point.y > points[2].y) {
                return false;
            }

            var leftp1 = points[0];
            var leftp2 = points[3];
            var rightp1 = points[1];
            var rightp2 = points[2];

            var leftx = (leftp2.x - leftp1.x) / (leftp2.y - leftp1.y) * (point.y - leftp2.y) + leftp2.x;
            var rightx = (rightp2.x - rightp1.x) / (rightp2.y - rightp1.y) * (point.y - rightp2.y) + rightp2.x;

            if (point.x >= leftx && point.x <= rightx) {
                return true;
            }
            return false;
        }

        this.getPoints = function() {
            return points;
        }

        this.getCoords = function() {
            return coords;
        }
    }

    var GraphicBoard = function(origin) {
        var board_origin = origin;
        var tiles = [];

        var offsetTile = function(cell, offset) {
            return newTile;
        }

        var coordToId = function(coord) {
            return coord.y * 8 + ( coord.x <= 1 ? coord.x*3 : 5 ) + (coord.x == 1 && coord.z == 2 ? 1 : coord.z);
        }

        var idToCoord = function(id) {
            var rem = id % 8;
            return {
                x: (rem < 5 ? Math.floor(rem / 3) : 2),
                y: id / 8,
                z: (tile < 4 ? tile % 3 : (tile == 4 ? 2 : tile-5))
            };
        }

        for (var i = 0; i < tile_data.origins.length; i++) {
            var origin = tile_data.origins[i];
            origin.x += board_origin.x;
            origin.y += board_origin.y;
            for (var j = 0; j < tile_data.tiles.length; j++) {
                var beforeOffset = tile_data.tiles[j];
                var points = new Array(beforeOffset.length);
                for (var k = 0; k < beforeOffset.length; k++) {
                    points[k] = {
                        x: beforeOffset[k].x + origin.x,
                        y: beforeOffset[k].y + origin.y
                    };
                }
                var coords = {
                    x: (j < 5 ? Math.floor(j / 3) : 2),
                    y: i,
                    z: (j < 4 ? j % 3 : (j == 4 ? 2 : j-5))
                };
                tiles.push(new Tile(points, coords));
            }
        }

        this.getTileForPoint = function(point) {
            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i].containsPoint(point)) {
                    return tiles[i];
                }
            }
            return null;
        }

        this.getTileForCoord = function(coord) {
            return tiles[coordToId(coord)];
        }
    }

    return GraphicBoard;
});
