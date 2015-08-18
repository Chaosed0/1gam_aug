
define(['jquery', './Util', './Constants'],
        function($, u, c) {

    var offsetCoord = function(coord, offset) {
        return {
            x: coord.x + (offset.x === undefined ? 0 : offset.x),
            y: coord.y + (offset.y === undefined ? 0 : offset.y),
            z: coord.z + (offset.z === undefined ? 0 : offset.z)
        };
    }

    var Board = function() {
        var tiles = new Array(24);

        for (var i = 0; i < tiles.length; i++) {
            tiles[i] = c.Marks.NONE;
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

        this.canPlaceMark = function(coord) {
            var tileId = coordToId(coord);
            u.assert(tileId >= 0 && tileId < 24, "Invalid tile coord " + JSON.stringify(coord));
            return tiles[coordToId(coord)] == c.Marks.NONE;
        }

        this.placeMark = function(coord, mark) {
            tiles[coordToId(coord)] = mark;

            this.checkWin(coord);
        }
        
        this.getMark = function(coord) {
            return tile[coordToId(coord)];
        }

        this.checkWin = function(coord) {
            /* All coordinates must check downward drills and sideways thrusts
             * All Corners have to check thrusts twice
             * Middle corners don't have to check diagonals
             * Top and bottom centers don't have to check diagonals */

            return null;

            var mark = this.getMark(coordToId(coord));
            var one, two, thr;

            var checkMarks = function() {
                if (this.getMark(coordToId(one)) == mark &&
                    this.getMark(coordToId(two)) == mark &&
                    this.getMark(coordToId(thr)) == mark) {
                    return true;
                }
                return false;
            }

            /* Drill */
            if (coord.y == 0) {
                one = coord;
                two = offsetCoord(coord, { y: 1 });
                thr = offsetCoord(coord, { y: 2 });
            } else if (coord.y == 1) {
                one = offsetCoord(coord, { y: -1 });
                two = coord;
                thr = offsetCoord(coord, { y: 1 });
            } else {
                one = offsetCoord(coord, { y: -2 });
                two = offsetCoord(coord, { y: -1 });
                thr = coord;
            }

            if (checkMarks() != null) {
                return [one, two, thr];
            }

            /* Sideways */
            if (coord.z != 1) {
                if (coord.x == 0) {
                    one = coord;
                    two = offsetCoord(coord, { x: 1 });
                    thr = offsetCoord(coord, { x: 2 });
                } else if (coord.x == 1) {
                    one = offsetCoord(coord, { x: -1 });
                    two = coord;
                    thr = offsetCoord(coord, { x: 1 });
                } else {
                    one = offsetCoord(coord, { x: -2 });
                    two = offsetCoord(coord, { x: -1 });
                    thr = coord;
                }
            }

            if (checkMarks() != null) {
                return [one, two, thr];
            }

            /* Downward */
            if (coord.x != 1) {
                if (coord.z == 0) {
                    one = coord;
                    two = offsetCoord(coord, { z: 1 });
                    thr = offsetCoord(coord, { z: 2 });
                } else if (coord.z == 1) {
                    one = offsetCoord(coord, { z: -1 });
                    two = coord;
                    thr = offsetCoord(coord, { z: 1 });
                } else {
                    one = offsetCoord(coord, { z: -2 });
                    two = offsetCoord(coord, { z: -1 });
                    thr = coord;
                }
            }

            /* From the top, left-right diagonal */
            if ((coord.y == 0 || coord.y == 2) && ((x+z) % 2) == 0) {
                one = coord;
                two = offsetCoord(coord, { x: (coord.x == 0 ? 1 : -1), y: 1 });
                thr = offsetCoord(coord, { x: (coord.x == 0 ? 2 : -2), y: 2 });
            }

            if (checkMarks() != null) {
                return [one, two, thr];
            }

            /* From the top, up-down diagonal */
            if ((coord.y == 0 || coord.y == 2) && ((x+z) % 2) == 0) {
                one = coord;
                two = offsetCoord(coord, { z: (coord.z == 0 ? 1 : -1), y: 1 });
                thr = offsetCoord(coord, { z: (coord.z == 0 ? 2 : -2), y: 2 });
            }

            if (checkMarks() != null) {
                return [one, two, thr];
            }

            /* From the middle, diagonal */
            if ((coord.y == 2) && ((x+z) % 2) == 0) {
                one = offsetCoord(coord, { x: (z == 0 ? 1 : -1), y: 1 });
                two = coord;
                three = offsetCoord(coord, { x: (z == 0 ? 2 : -2), y: 2 });
            }
        }
    }

    return Board;
});
