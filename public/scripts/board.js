
define(['jquery', './Util', './Constants', './Tile', './tile_data'],
        function($, u, c, Tile, tile_data) {
    var Board = function(origin) {
        var board_origin = origin;
        var tiles = [];

        var offsetTile = function(cell, offset) {
            return newTile;
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
                    x: (j == 0 || j == 3 || j == 5 ? 0 : (j == 1 || j == 6 ? 1 : 2)),
                    y: i,
                    z: (j < 3 ? 0 : (j < 5 ? 1 : 2))
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
    }

    return Board;
});
