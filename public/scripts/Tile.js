
define(['jquery', './Util', './Constants'],
        function($, u, c) {
    var Tile = function(points, coords) {
        var mark = Tile.Marks.NONE;

        this.containsPoint = function(point) {
            /* We're assuming two properties of the boundss:
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
        
        this.getMark = function() {
            return mark;
        }

        this.setMark = function(new_mark) {
            mark = new_mark;
        }
    }

    Tile.Marks = {
        X: 0,
        Y: 1,
        J: 2,
        NONE: 3,
        LENGTH: 4
    };

    return Tile;
});
