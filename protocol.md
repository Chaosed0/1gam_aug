
Protocol overview
====

Board representation
----

The board looks like this (the X spots aren't playable):

    left -----> right     upper
                            |
        0  1  2    top      |
        3  X  4     v       |
        5  6  7   bottom    |
                            |
        8  9  10            |
        11 X  12            |
        13 14 15            |
                            |
        16 17 18            |
        19 X  20            v
        21 22 23          lower

The board is indexed from left to right (x), from upper to lower (y), and from top to bottom (z). Some example id to coordinate mappings:

    - 0 -> (0,0,0)
    - 1 -> (0,0,1)
    - 3 -> (1,0,0)
    - 4 -> (1,0,2)
    - 7 -> (2,0,2)
    - 12 -> (1,1,2)
    - 23 -> (2,2,2)

Client -> Server messages
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

Server -> Client messages
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

    board_state {
        state: [ number ] x24
    }

Sent to a player who joins the game after someone has left. The state consists of 24 player IDs corresponding to the tiles of the board like this:

Server errors
----

    enum {
        ROOM_FULL = 0,
        NAME_TAKEN,
        INVALID_COORDINATE,
        INVALID_ROOM_NAME,
        INVALID_MESSAGE,
        PARSE_ERROR,
        GENERAL_ERROR
    }
