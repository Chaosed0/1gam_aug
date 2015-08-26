
define(function() {
    var c = {};
    c.Marks = {
        X: 0,
        O: 1,
        J: 2,
        NONE: 3
    };
    c.server_errors = {
        ROOM_FULL: 0,
        NAME_TAKEN: 1,
        INVALID_COORDINATE: 2,
        INVALID_ROOM_NAME: 3,
        INVALID_MESSAGE: 4,
        PARSE_ERROR: 5,
        GENERAL_ERROR: 3
    };
    return c;
});
