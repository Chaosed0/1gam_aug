
define(['shared/Constants'], function(c) {
    var ConnectionUtil = {};

    ConnectionUtil.constructMessage = function(type, data) {
        return {
            type: type,
            data: data
        };
    }

    ConnectionUtil.constructError = function(error, msg) {
        return this.constructMessage('error', { type: error, data: msg });
    };

    ConnectionUtil.constructGeneralError = function(msg) {
        return this.constructError(c.server_errors.GENERAL_ERROR, msg);
    };

    ConnectionUtil.validateMessage = function(msg) {
        var error = null;
        var checkField = function(data, field, msgtype) {
            if (data[field] !== undefined) {
                return;
            }

            if (msgtype === undefined) {
                error = "Message was missing '" + field + "' field";
            } else {
                error = msgtype + " message was missing '" + field + "' field";
            }
        } 

        checkField(msg, 'type');
        checkField(msg, 'data');
        
        if (error != null) {
            return error;
        }

        var type = msg.type;
        var data = msg.data;
        if (type == "join_room") {
            checkField(data, 'room', type);
            checkField(data, 'name', type);
        } else if (type == "place_mark") {
            checkField(data, 'position', type);
        }

        return error;
    };

    return ConnectionUtil;
});
