
Protocol overview
====

Client -> Server
----

join_room {
    room: string
    name: string
}

Possible responses: error (room full), error (name taken), room_joined

place_mark {
    position: coordinate;
}

Sent when the client places their mark on a spot. Possible responses: error (invalid coordinate), mark_placed

Server -> Client
----

room_joined {
    id: number
}

The id is used as the mark index: X = 0, O = 1, J = 2

player_joined {
    name: string
    id: number
}

Sent when a player joins a room you are currently in AND when you join a room (to notify you of players who are already in the room)

player_turn {
    id: number
}

Broadcast to all players when it is the turn of player id.

mark_placed {
    id: number,
    position: coordinate
}

Broadcast to all players when some player has placed their mark.

game_over {
    winner_id: number
    winning_marks: [
        coordinate, coordinate, coordinate
    ]
}

Broadcast to all players when one of them has won the game.

player_left {
    id: number
}

Broadcast to all players when a player leaves.

error {
    type: error_type
    data: string
}

Sent to a player when they attempt to do something invalid.

Server errors
----

{
    ROOM_FULL
    NAME_TAKEN
    INVALID_COORDINATE
    GENERAL_ERROR
}
