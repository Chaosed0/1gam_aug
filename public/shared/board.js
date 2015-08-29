
define(['shared/Util', 'shared/Constants'],
        function(u, c) {

    var offsetCoord = function(coord, offset, amt) {
        if (amt === undefined) {
            return {
                x: coord.x + (offset.x === undefined ? 0 : offset.x),
                y: coord.y + (offset.y === undefined ? 0 : offset.y),
                z: coord.z + (offset.z === undefined ? 0 : offset.z)
            };
        } else {
            var obj = { x: coord.x, y: coord.y, z: coord.z };
            obj[offset] += amt;
            return obj;
        }
    }

    var Board = function() {
        var self = this;
        var tiles = new Array(24);
        var tilePlaced = false;

        for (var i = 0; i < tiles.length; i++) {
            tiles[i] = c.Marks.NONE;
        }

        var coordToId = function(coord) {
            u.assert(coord.x >= 0 && coord.x < 3 && coord.z >= 0 && coord.z < 3 && coord.y >= 0 && coord.y < 3);
            u.assert(coord.x != 1 || coord.z != 1);
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

        this.getState = function() {
            return tiles;
        }

        this.canPlaceMark = function(coord) {
            var tileId = coordToId(coord);
            u.assert(tileId >= 0 && tileId < 24, "Invalid tile coord " + JSON.stringify(coord));
            return tiles[coordToId(coord)] == c.Marks.NONE;
        }

        this.placeMark = function(coord, mark) {
            tiles[coordToId(coord)] = mark;
            return this.checkWin(coord);
        }
        
        this.getMarkForCoord = function(coord) {
            return tiles[coordToId(coord)];
        }

        this.checkWin = function(coord) {
            /* All coordinates must check downward drills and sideways thrusts
             * All Corners have to check thrusts twice
             * Center corners don't have to check diagonals
             * Top and bottom centers don't have to check diagonals */
            var mark = this.getMarkForCoord(coord);
            var one, two, thr;

            var checkMarks = function(dir) {
                if (dir !== undefined) {
                    if (coord[dir] == 0) {
                        one = coord;
                        two = offsetCoord(coord, dir, 1);
                        thr = offsetCoord(coord, dir, 2);
                    } else if (coord[dir] == 1) {
                        one = offsetCoord(coord, dir, -1);
                        two = coord;
                        thr = offsetCoord(coord, dir, 1);
                    } else {
                        one = offsetCoord(coord, dir, -2);
                        two = offsetCoord(coord, dir, -1);
                        thr = coord;
                    }
                }

                if (self.getMarkForCoord(one) == mark &&
                    self.getMarkForCoord(two) == mark &&
                    self.getMarkForCoord(thr) == mark) {
                    return true;
                }
                return false;
            }

            /* Drill */
            if (checkMarks('y')) {
                return [one, two, thr];
            }

            /* Sideways */
            if (coord.x != 1 && checkMarks('z')) {
                return [one, two, thr];
            }

            /* Downward */
            if (coord.z != 1 && checkMarks('x')) {
                return [one, two, thr];
            }

            /* From the top or bottom, left-right diagonal */
            if ((coord.y == 0 || coord.y == 2) && ((coord.x+coord.z) % 2) == 0) {
                one = coord;
                two = offsetCoord(coord, { x: (coord.x == 0 ? 1 : -1), y: (coord.y == 0 ? 1 : -1) });
                thr = offsetCoord(coord, { x: (coord.x == 0 ? 2 : -2), y: (coord.y == 0 ? 2 : -2) });
                if (checkMarks()) {
                    return [one, two, thr];
                }
            }

            /* From the top or bottom, up-down diagonal */
            if ((coord.y == 0 || coord.y == 2) && ((coord.x+coord.z) % 2) == 0) {
                one = coord;
                two = offsetCoord(coord, { z: (coord.z == 0 ? 1 : -1), y: (coord.y == 0 ? 1 : -1) });
                thr = offsetCoord(coord, { z: (coord.z == 0 ? 2 : -2), y: (coord.y == 0 ? 2 : -2) });
                if (checkMarks()) {
                    return [one, two, thr];
                }
            }

            /* From the center, top-left to bottom-right or top-upper to bottom-down */
            if ((coord.y == 1) && ((coord.x+coord.z) % 2) == 1) {
                if (coord.z == 1) {
                    one = offsetCoord(coord, { z: -1, y: -1 });
                    thr = offsetCoord(coord, { z: 1, y: 1 });
                } else {
                    one = offsetCoord(coord, { x: -1, y: -1 });
                    thr = offsetCoord(coord, { x: 1, y: 1 });
                }
                two = coord;
                if (checkMarks()) {
                    return [one, two, thr];
                }
            }

            /* From the center, top-right to bottom-left or top-down to bottom-upper */
            if ((coord.y == 1) && ((coord.x+coord.z) % 2) == 1) {
                if (coord.z == 1) {
                    one = offsetCoord(coord, { z: 1, y: -1 });
                    thr = offsetCoord(coord, { z: -1, y: 1 });
                } else {
                    one = offsetCoord(coord, { x: 1, y: -1 });
                    thr = offsetCoord(coord, { x: -1, y: 1 });
                }
                two = coord;
                if (checkMarks()) {
                    return [one, two, thr];
                }
            }

            return null;
        }
    }

    return Board;
});
