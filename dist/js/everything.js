var gameLogic;
(function (gameLogic) {
    gameLogic.ENUM = {
        ILLEGAL_CODE: {
            ILLEGAL_MOVE: 'ILLEGAL_MOVE',
            ILLEGAL_SIMPLE_MOVE: 'ILLEGAL_SIMPLE_MOVE',
            ILLEGAL_JUMP_MOVE: 'ILLEGAL_JUMP_MOVE',
            ILLEGAL_DELTA: 'ILLEGAL_DELTA',
            ILLEGAL_COLOR_CHANGED: 'ILLEGAL_COLOR_CHANGED',
            ILLEGAL_CROWNED: 'ILLEGAL_CROWNED',
            ILLEGAL_UNCROWNED: 'ILLEGAL_UNCROWNED',
            ILLEGAL_IGNORE_MANDATORY_JUMP: 'ILLEGAL_IGNORE_MANDATORY_JUMP',
            ILLEGAL_SET_TURN: 'ILLEGAL_SET_TURN',
            ILLEGAL_END_MATCH_SCORE: 'ILLEGAL_END_MATCH_SCORE',
            ILLEGAL_CODE: 'ILLEGAL_CODE'
        },
        DIRECTION: {
            UP_LEFT: 'UP_LEFT',
            UP_RIGHT: 'UP_RIGHT',
            DOWN_LEFT: 'DOWN_LEFT',
            DOWN_RIGHT: 'DOWN_RIGHT'
        },
        MOVE_TYPE: {
            SIMPLE_MOVE: 'SIMPLE_MOVE',
            JUMP_MOVE: 'JUMP_MOVE'
        }
    };
    var ILLEGAL_CODE = gameLogic.ENUM.ILLEGAL_CODE, DIRECTION = gameLogic.ENUM.DIRECTION, MOVE_TYPE = gameLogic.ENUM.MOVE_TYPE;
    gameLogic.CONSTANTS = {
        ROW: 8,
        // Since only the dark square may contain pieces, for both the
        // gameApiState and logicState, I only concern the dark squares.
        // Therefore the column is count to only 4.
        COLUMN: 8,
        LIGHT_SQUARE: '--',
        DARK_SQUARE: 'DS',
        BLACK_MAN: 'BM',
        BLACK_KING: 'BK',
        WHITE_MAN: 'WM',
        WHITE_KING: 'WK',
        BLACK: 'B',
        WHITE: 'W',
        MAN: 'M',
        KING: 'K',
        WHITE_INDEX: 0,
        BLACK_INDEX: 1
    };
    /**
     * Check if the object is empty
     *
     * @param obj the object to be checked
     * @returns true if is empty, otherwise false.
     */
    function isEmptyObj(obj) {
        var prop;
        for (prop in obj) {
            if (!obj.prop) {
                return false;
            }
        }
        return true;
    }
    gameLogic.isEmptyObj = isEmptyObj;
    /**
     * Get the color of the piece within the square.
     *
     * @param square the square of the board.
     * @returns string "B" if the piece is black, "W" if the piece is white,
     *          otherwise the square is empty.
     */
    function getColor(square) {
        return square.substr(0, 1);
    }
    gameLogic.getColor = getColor;
    /**
     * Get the kind of the piece within the square.
     *
     * @param square the square of the board.
     * @returns string "M" if the piece is man, "K" if the piece is king or
     *                 crowned
     */
    function getKind(square) {
        return square.substr(1);
    }
    gameLogic.getKind = getKind;
    /**
     * Check if the two deltas are the same.
     *
     * @param delta1
     * @param delta2
     * @returns {boolean}
     */
    function isDeltaEqual(delta1, delta2) {
        if (delta1.row !== delta2.row) {
            return false;
        }
        if (delta1.col !== delta2.col) {
            return false;
        }
        return true;
    }
    /**
     * Check if the move exists in the moves array
     *
     * @param moves all possible moves
     * @param move the move need to be checked
     * @returns {boolean} true if the move exists, otherwise false
     */
    function doesContainMove(moves, move) {
        for (var i = 0; i < moves.length; i += 1) {
            if (isDeltaEqual(moves[i], move)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check whether the turn index matches the color of the moving or
     * jumping piece. In another word, check whether the player is operating
     * his/her own piece.
     *
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @param color the color of the moving or jumping piece.
     * @returns true if the index matches the color, otherwise false.
     */
    function isOwnColor(turnIndex, color) {
        if ((turnIndex === gameLogic.CONSTANTS.BLACK_INDEX &&
            color === gameLogic.CONSTANTS.BLACK) ||
            (turnIndex === gameLogic.CONSTANTS.WHITE_INDEX &&
                color === gameLogic.CONSTANTS.WHITE)) {
            return true;
        }
        return false;
    }
    gameLogic.isOwnColor = isOwnColor;
    /**
     * Check if the square index is legal
     * @param squareIndex the squareIndex need to be check
     * @returns true if legal, otherwise false
     */
    function isDarkSquare(delta) {
        var row = delta.row, col = delta.col, isEvenRow, isEvenCol;
        // Make sure the delta has the row and col property
        if (!(delta.hasOwnProperty('row') && delta.hasOwnProperty('col'))) {
            return false;
        }
        // The game board is 8*8 and the index of row and column start at 0
        // and end at 7
        if (row < 0 || row >= gameLogic.CONSTANTS.ROW ||
            col < 0 || col >= gameLogic.CONSTANTS.COLUMN) {
            return false;
        }
        isEvenRow = row % 2 === 0;
        isEvenCol = col % 2 === 0;
        // Only dark square is able to hold a piece
        if ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol)) {
            return true;
        }
        return false;
    }
    /**
     * Check if it's a simple move according to the from and to delta.
     *
     * @param fromDelta from delta
     * @param toDelta to delta
     * @returns {boolean} true if it's simple move, otherwise false
     */
    function isSimpleMove(board, fromDelta, toDelta) {
        var square = board[fromDelta.row][fromDelta.col];
        if (getKind(square) === gameLogic.CONSTANTS.KING) {
            // If it's a king, it can move both forward and backward
            if ((Math.abs(fromDelta.row - toDelta.row) === 1) &&
                (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
            }
        }
        else if (getColor(square) === gameLogic.CONSTANTS.BLACK) {
            // If it's not a black king, it can only move downwards.
            if ((fromDelta.row - toDelta.row === -1) &&
                (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
            }
        }
        else if (getColor(square) === gameLogic.CONSTANTS.WHITE) {
            // If it's not a white king, it can only move upwards.
            if ((fromDelta.row - toDelta.row === 1) &&
                (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
            }
        }
        return false;
    }
    gameLogic.isSimpleMove = isSimpleMove;
    /**
     * Check if it's a jump move according to the from and to coordinate.
     *
     * @param fromDelta from delta
     * @param toDelta to delta
     * @returns {boolean} true if it's jump move, otherwise false
     */
    function isJumpMove(board, fromDelta, toDelta) {
        var square = board[fromDelta.row][fromDelta.col];
        if (getKind(square) === gameLogic.CONSTANTS.KING) {
            // If it's a king, it can jump both forward and backward
            if ((Math.abs(fromDelta.row - toDelta.row) === 2) &&
                (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
            }
        }
        else if (getColor(square) === gameLogic.CONSTANTS.BLACK) {
            // If it's not a black king, it can only jump downwards.
            if ((fromDelta.row - toDelta.row === -2) &&
                (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
            }
        }
        else if (getColor(square) === gameLogic.CONSTANTS.WHITE) {
            // If it's not a white king, it can only jump upwards.
            if ((fromDelta.row - toDelta.row === 2) &&
                (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
            }
        }
        return false;
    }
    gameLogic.isJumpMove = isJumpMove;
    /**
     * Check if the jump is valid. The piece can only jump over an
     * opponent piece and the destination square must be empty.
     *
     * @param fromSquare the player's piece which jumps
     * @param jumpedSquare the jumped (opponent) piece which is being
     *                     jumped over
     * @param toSquare the destination square
     * @returns true if the jump is valid, otherwise false
     */
    function isValidJump(fromSquare, jumpedSquare, toSquare) {
        return jumpedSquare !== gameLogic.CONSTANTS.DARK_SQUARE &&
            fromSquare.substr(0, 1) !== jumpedSquare.substr(0, 1) &&
            toSquare === gameLogic.CONSTANTS.DARK_SQUARE;
    }
    /**
     * Check if the square is moving or jumping to the kings row
     *
     * @param toDelta the delta of the square moving to or jumping to
     * @param playerTurnIndex the player's turn index
     * @returns true if it enters the kings row, otherwise false.
     */
    function hasMoveOrJumpToKingsRow(toDelta, playerTurnIndex) {
        // Check if the square can be crowned
        if (
        // For white square, it's moving or jumping to the first row
        (playerTurnIndex === gameLogic.CONSTANTS.WHITE_INDEX && toDelta.row === 0) ||
            // For black square, it's moving or jumping to the last row
            (playerTurnIndex === gameLogic.CONSTANTS.BLACK_INDEX && toDelta.row === gameLogic.CONSTANTS.ROW - 1)) {
            return true;
        }
        return false;
    }
    /**
     * Get the to square delta (the destination of the move) according to
     * the move type and direction.
     *
     * @param fromDelta the from square (the square contains the piece
     *                        moved or jumped) delta.
     * @param moveType the move type of the move, either simple move or jump
     *                 move
     * @param direction the direction of the move, up-left, up-right,
     *                  down-left and down-right.
     * @returns {number} the to square delta.
     */
    function getToDelta(fromDelta, moveType, direction) {
        var toDelta = { row: -1, col: -1 };
        if (!isDarkSquare(fromDelta)) {
            throw new Error("Illegal from coordinate!!!");
        }
        switch (moveType) {
            case MOVE_TYPE.SIMPLE_MOVE:
                switch (direction) {
                    case DIRECTION.UP_LEFT:
                        toDelta.row = fromDelta.row - 1;
                        toDelta.col = fromDelta.col - 1;
                        break;
                    case DIRECTION.UP_RIGHT:
                        toDelta.row = fromDelta.row - 1;
                        toDelta.col = fromDelta.col + 1;
                        break;
                    case DIRECTION.DOWN_LEFT:
                        toDelta.row = fromDelta.row + 1;
                        toDelta.col = fromDelta.col - 1;
                        break;
                    case DIRECTION.DOWN_RIGHT:
                        toDelta.row = fromDelta.row + 1;
                        toDelta.col = fromDelta.col + 1;
                        break;
                    default:
                        throw new Error("Illegal direction!");
                }
                break;
            case MOVE_TYPE.JUMP_MOVE:
                switch (direction) {
                    case DIRECTION.UP_LEFT:
                        toDelta.row = fromDelta.row - 2;
                        toDelta.col = fromDelta.col - 2;
                        break;
                    case DIRECTION.UP_RIGHT:
                        toDelta.row = fromDelta.row - 2;
                        toDelta.col = fromDelta.col + 2;
                        break;
                    case DIRECTION.DOWN_LEFT:
                        toDelta.row = fromDelta.row + 2;
                        toDelta.col = fromDelta.col - 2;
                        break;
                    case DIRECTION.DOWN_RIGHT:
                        toDelta.row = fromDelta.row + 2;
                        toDelta.col = fromDelta.col + 2;
                        break;
                    default:
                        throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
                }
                break;
            default:
                throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
        }
        if (!isDarkSquare(toDelta)) {
            throw new Error(ILLEGAL_CODE.ILLEGAL_DELTA);
        }
        return toDelta;
    }
    /**
     * Get all possible upwards simple moves for a specific piece by its
     * square delta.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @return an array of all possible moves
     */
    function getSimpleUpMoves(board, delta) {
        var moves = [], leftUpDelta, rightUpDelta;
        // If the piece is in the first row, then there's no way to move
        // upwards.
        if (delta.row === 0) {
            return moves;
        }
        if (delta.row % 2 === 0) {
            // Even row
            // Check left up
            leftUpDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
            if (board[leftUpDelta.row][leftUpDelta.col] ===
                gameLogic.CONSTANTS.DARK_SQUARE) {
                moves.push(leftUpDelta);
            }
            // Check right up
            // for the rightmost one, it can only move to the left up side.
            if (delta.col !== gameLogic.CONSTANTS.COLUMN - 1) {
                rightUpDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
                if (board[rightUpDelta.row][rightUpDelta.col] ===
                    gameLogic.CONSTANTS.DARK_SQUARE) {
                    moves.push(rightUpDelta);
                }
            }
        }
        else {
            // Odd row
            // Check left up
            // For the leftmost one, it can only move to the right up side
            if (delta.col !== 0) {
                leftUpDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
                if (board[leftUpDelta.row][leftUpDelta.col] ===
                    gameLogic.CONSTANTS.DARK_SQUARE) {
                    moves.push(leftUpDelta);
                }
            }
            // Check right up
            rightUpDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
            if (board[rightUpDelta.row][rightUpDelta.col] ===
                gameLogic.CONSTANTS.DARK_SQUARE) {
                moves.push(rightUpDelta);
            }
        }
        return moves;
    }
    /**
     * Get all possible downwards simple moves for a specific piece by its
     * square delta.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @return an array of all possible moves
     */
    function getSimpleDownMoves(board, delta) {
        var moves = [], leftDownDelta, rightDownDelta;
        // If the piece is in the last row, then there's no way to move
        // downwards.
        if (delta.row === gameLogic.CONSTANTS.ROW - 1) {
            return moves;
        }
        if (delta.row % 2 === 0) {
            // Even row
            // Check left down
            leftDownDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
            if (board[leftDownDelta.row][leftDownDelta.col] ===
                gameLogic.CONSTANTS.DARK_SQUARE) {
                moves.push(leftDownDelta);
            }
            // Check right down
            // for the rightmost one, it can only move to the left down side.
            if (delta.col !== gameLogic.CONSTANTS.COLUMN - 1) {
                rightDownDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
                if (board[rightDownDelta.row][rightDownDelta.col] ===
                    gameLogic.CONSTANTS.DARK_SQUARE) {
                    moves.push(rightDownDelta);
                }
            }
        }
        else {
            // Odd row
            // Check left down
            // For the leftmost one, it can only move to the right down side
            if (delta.col !== 0) {
                leftDownDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
                if (board[leftDownDelta.row][leftDownDelta.col] ===
                    gameLogic.CONSTANTS.DARK_SQUARE) {
                    moves.push(leftDownDelta);
                }
            }
            // Check right down
            rightDownDelta = getToDelta(delta, MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
            if (board[rightDownDelta.row][rightDownDelta.col] ===
                gameLogic.CONSTANTS.DARK_SQUARE) {
                moves.push(rightDownDelta);
            }
        }
        return moves;
    }
    /**
     * Calculate the jumped (opponent) square delta
     * @param fromDelta the first selected square delta.
     *                      (The one moving or jumping)
     * @param toDelta the second selected square delta.
     *                     (The destination)
     * @returns {row: row, col: col} the jumped (opponent) square delta
     */
    function getJumpedDelta(fromDelta, toDelta) {
        var jumpedDelta = { row: -1, col: -1 };
        if (!isDarkSquare(fromDelta) || !isDarkSquare(toDelta)) {
            throw new Error("Illegal coordinate!!!");
        }
        if ((Math.abs(fromDelta.row - toDelta.row) === 2) &&
            (Math.abs(fromDelta.col - toDelta.col) === 2)) {
            jumpedDelta.row = (fromDelta.row + toDelta.row) / 2;
            jumpedDelta.col = (fromDelta.col + toDelta.col) / 2;
        }
        return jumpedDelta;
    }
    gameLogic.getJumpedDelta = getJumpedDelta;
    /**
     * Get all possible upwards jump moves for a specific piece by its
     * square delta.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @return an array of all possible moves
     */
    function getJumpUpMoves(board, delta) {
        var moves = [], fromDelta = delta, fromSquare = board[delta.row][delta.col], jumpedDelta, jumpedSquare, toDelta, toSquare;
        // If the piece is in either the first or the second row, then there's
        // no way to jump upwards.
        if (fromDelta.row < 2) {
            return moves;
        }
        // Check left first, for the leftmost one, it can only jump right
        // upwards.
        if (fromDelta.col > 1) {
            toDelta = getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_LEFT);
            jumpedDelta = getJumpedDelta(fromDelta, toDelta);
            toSquare = board[toDelta.row][toDelta.col];
            jumpedSquare = board[jumpedDelta.row][jumpedDelta.col];
            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toDelta);
            }
        }
        // Check right, for the rightmost one, it can only jump left upwards.
        if (fromDelta.col < gameLogic.CONSTANTS.COLUMN - 2) {
            toDelta =
                getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_RIGHT);
            jumpedDelta = getJumpedDelta(fromDelta, toDelta);
            toSquare = board[toDelta.row][toDelta.col];
            jumpedSquare = board[jumpedDelta.row][jumpedDelta.col];
            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toDelta);
            }
        }
        return moves;
    }
    /**
     * Get all possible downwards jump moves for a specific piece by its
     * square delta.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @return an array of all possible moves
     */
    function getJumpDownMoves(board, delta) {
        var fromCoordinate = delta, fromSquare = board[delta.row][delta.col], jumpedCoordinate, jumpedSquare, toCoordinate, toSquare, moves = [];
        // If the piece is in the last two rows, then there's no way to jump
        // downwards.
        if (fromCoordinate.row > gameLogic.CONSTANTS.ROW - 3) {
            return moves;
        }
        // Check left first, for the leftmost one, it can only jump right
        // downwards.
        if (fromCoordinate.col > 1) {
            toCoordinate = getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_LEFT);
            jumpedCoordinate = getJumpedDelta(fromCoordinate, toCoordinate);
            toSquare = board[toCoordinate.row][toCoordinate.col];
            jumpedSquare = board[jumpedCoordinate.row][jumpedCoordinate.col];
            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toCoordinate);
            }
        }
        // Check right, for the rightmost one, it can only jump left
        // downwards.
        if (fromCoordinate.col < gameLogic.CONSTANTS.COLUMN - 2) {
            toCoordinate = getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_RIGHT);
            jumpedCoordinate = getJumpedDelta(fromCoordinate, toCoordinate);
            toSquare = board[toCoordinate.row][toCoordinate.col];
            jumpedSquare = board[jumpedCoordinate.row][jumpedCoordinate.col];
            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toCoordinate);
            }
        }
        return moves;
    }
    /**
     * Get all possible simple moves for a specific piece by its square
     * delta. If it is crowned, also check if it can move one step backward.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @return an array of all possible moves.
     */
    function getSimpleMoves(board, delta, turnIndex) {
        var moves = [], tmpMoves = [], fromSquare = board[delta.row][delta.col], color = fromSquare.substr(0, 1), kind = fromSquare.substr(1);
        // Check whether it's the current player's piece first, if not, since
        // the player can not operate it, then no move will be available.
        if (isOwnColor(turnIndex, color)) {
            if (kind === gameLogic.CONSTANTS.KING) {
                // Check both direction moves
                tmpMoves = getSimpleUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
                tmpMoves = getSimpleDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
            else if (color === gameLogic.CONSTANTS.WHITE) {
                tmpMoves = getSimpleUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
            else if (color === gameLogic.CONSTANTS.BLACK) {
                tmpMoves = getSimpleDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
        }
        return moves;
    }
    gameLogic.getSimpleMoves = getSimpleMoves;
    /**
     * Get all possible jump moves for a specific piece by its square delta.
     * If it is crowned, also check if it can jump one step backward.
     *
     * @param board the game board
     * @param delta the delta of the square holds the piece
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @return an array of all possible moves
     */
    function getJumpMoves(board, delta, turnIndex) {
        var moves = [], tmpMoves = [], fromSquare = board[delta.row][delta.col], color = fromSquare.substr(0, 1), kind = fromSquare.substr(1);
        // Check whether it's the current player's piece first, if not, since
        // the player can not operate it, then no move will be available.
        if (isOwnColor(turnIndex, color)) {
            if (kind === gameLogic.CONSTANTS.KING) {
                // Check both direction moves
                tmpMoves = getJumpUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
                tmpMoves = getJumpDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
            else if (color === gameLogic.CONSTANTS.WHITE) {
                tmpMoves = getJumpUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
            else if (color === gameLogic.CONSTANTS.BLACK) {
                tmpMoves = getJumpDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
            }
        }
        return moves;
    }
    gameLogic.getJumpMoves = getJumpMoves;
    /**
     * Get all possible moves for a specific piece by its square delta.
     *
     * @param board the game board.
     * @param delta the delta of the square holds the piece
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @return an array of all possible move.
     */
    function getAllPossibleMoves(board, delta, turnIndex) {
        var possibleMoves;
        // First get all possible jump moves.
        possibleMoves = getJumpMoves(board, delta, turnIndex);
        // If there's at least one jump move, then no need to check the simple
        // moves since jump move is mandatory.
        if (possibleMoves.length === 0) {
            possibleMoves = getSimpleMoves(board, delta, turnIndex);
        }
        return possibleMoves;
    }
    gameLogic.getAllPossibleMoves = getAllPossibleMoves;
    /**
     * Get the winner based on the current board.
     *
     * @param board the game board
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @returns string "B" if the piece is black, "W" if the piece is
     *                white, otherwise it's empty.
     */
    function getWinner(board, turnIndex) {
        var allPossibleMoves = [], hasWhite, hasBlack, square, coordinate = { row: -1, col: -1 }, row, col;
        // Check whether there's any piece for both of the player
        for (row = 0; row < gameLogic.CONSTANTS.ROW; row += 1) {
            for (col = 0; col < gameLogic.CONSTANTS.COLUMN; col += 1) {
                if (getColor(board[row][col]) === gameLogic.CONSTANTS.WHITE) {
                    hasWhite = true;
                }
                else if (getColor(board[row][col]) === gameLogic.CONSTANTS.BLACK) {
                    hasBlack = true;
                }
                if (hasWhite === true && hasBlack === true) {
                    // No need to check the rest
                    break;
                }
            }
        }
        // White won because white player has no pieces
        if (hasWhite && !hasBlack) {
            return gameLogic.CONSTANTS.WHITE;
        }
        // Black won because black player has no pieces
        if (!hasWhite && hasBlack) {
            return gameLogic.CONSTANTS.BLACK;
        }
        // Get all the moves for the current turn player
        for (row = 0; row < gameLogic.CONSTANTS.ROW; row += 1) {
            for (col = 0; col < gameLogic.CONSTANTS.COLUMN; col += 1) {
                coordinate.row = row;
                coordinate.col = col;
                square = board[row][col];
                if (turnIndex === gameLogic.CONSTANTS.BLACK_INDEX) {
                    allPossibleMoves = allPossibleMoves.concat(getAllPossibleMoves(board, coordinate, 1 - turnIndex));
                }
                else {
                    // Get all white's moves
                    allPossibleMoves = allPossibleMoves.concat(getAllPossibleMoves(board, coordinate, 1 - turnIndex));
                }
            }
        }
        if (allPossibleMoves.length === 0) {
            if (turnIndex === gameLogic.CONSTANTS.BLACK_INDEX) {
                // Black has no moves, so white wins!
                return gameLogic.CONSTANTS.BLACK;
            }
            return gameLogic.CONSTANTS.WHITE;
        }
        // No winner, the game is not ended.
        return '';
    }
    gameLogic.getWinner = getWinner;
    /**
     * Check if there's any mandatory jumps for the player.
     *
     * @returns true if there has, otherwise false.
     */
    function hasMandatoryJumps(board, yourPlayerIndex) {
        var possibleMoves = [], delta = { row: -1, col: -1 }, row, col;
        for (row = 0; row < gameLogic.CONSTANTS.ROW; row += 1) {
            for (col = 0; col < gameLogic.CONSTANTS.COLUMN; col += 1) {
                delta.row = row;
                delta.col = col;
                possibleMoves = possibleMoves.concat(getJumpMoves(board, delta, yourPlayerIndex));
            }
        }
        return possibleMoves.length > 0;
    }
    gameLogic.hasMandatoryJumps = hasMandatoryJumps;
    /**
     * Get the expected operations for the selected squares (from and to
     * square deltas).
     *
     * @param board the game API state.
     * @param fromDelta the first selected square delta. (The one moving or
     *                  jumping)
     * @param toDelta the second selected square delta. (The destination)
     * @param turnIndexBeforeMove 0 represents the black player and 1
     *        represents the white player.
     * @returns {Array} operations
     */
    function createMiniMove(board, fromDelta, toDelta, turnIndexBeforeMove) {
        if (!board) {
            board = getInitialBoard();
        }
        else {
            board = angular.copy(board);
        }
        var isAJumpMove = false, isASimpleMove = false, possibleSimpleMoves, winner, jumpedCoord;
        var originalKind = board[fromDelta.row][fromDelta.col].substr(1);
        /*********************************************************************
         * 1. Check the coordinates first.
         ********************************************************************/
        if (!isDarkSquare(fromDelta) ||
            !isDarkSquare(toDelta)) {
            throw new Error(ILLEGAL_CODE.ILLEGAL_DELTA);
        }
        if (isSimpleMove(board, fromDelta, toDelta)) {
            isASimpleMove = true;
        }
        else if (isJumpMove(board, fromDelta, toDelta)) {
            isAJumpMove = true;
        }
        /*********************************************************************
         * 2a. Check if the move is legal
         ********************************************************************/
        if (isASimpleMove) {
            // Simple move
            // Check if there are any mandatory jumps.
            if (hasMandatoryJumps(board, turnIndexBeforeMove)) {
                // At least one jump move exists for the player, since jump move
                // is mandatory, the move is illegal.
                throw new Error(ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
            }
            // No mandatory jumps, then get all simple moves.
            possibleSimpleMoves = getSimpleMoves(board, fromDelta, turnIndexBeforeMove);
            // The move should exist in the possible simple moves.
            if (!doesContainMove(possibleSimpleMoves, toDelta)) {
                throw new Error(ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
            }
        }
        else if (isAJumpMove) {
            // Jump move
            var possibleJumpMoves = getJumpMoves(board, fromDelta, turnIndexBeforeMove);
            // The move should exist in the possible jump moves.
            if (!doesContainMove(possibleJumpMoves, toDelta)) {
                throw new Error(ILLEGAL_CODE.ILLEGAL_JUMP_MOVE);
            }
        }
        else {
            // Illegal move since it's not simple move nor jump move.
            throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
        }
        /*********************************************************************
         * 2b. Set the board.
         ********************************************************************/
        if (isASimpleMove) {
            board[toDelta.row][toDelta.col] =
                board[fromDelta.row][fromDelta.col];
            board[fromDelta.row][fromDelta.col] = gameLogic.CONSTANTS.DARK_SQUARE;
        }
        else if (isAJumpMove) {
            jumpedCoord = getJumpedDelta(fromDelta, toDelta);
            board[toDelta.row][toDelta.col] =
                board[fromDelta.row][fromDelta.col];
            board[fromDelta.row][fromDelta.col] = gameLogic.CONSTANTS.DARK_SQUARE;
            board[jumpedCoord.row][jumpedCoord.col] = gameLogic.CONSTANTS.DARK_SQUARE;
        }
        /*********************************************************************
         * 3. Check if the piece remains the same or is legally crowned.
         ********************************************************************/
        var isToKingsRow = hasMoveOrJumpToKingsRow(toDelta, turnIndexBeforeMove);
        if (isToKingsRow) {
            if (getColor(board[toDelta.row][toDelta.col]) ===
                gameLogic.CONSTANTS.BLACK) {
                board[toDelta.row][toDelta.col] = gameLogic.CONSTANTS.BLACK_KING;
            }
            else if (getColor(board[toDelta.row][toDelta.col]) ===
                gameLogic.CONSTANTS.WHITE) {
                board[toDelta.row][toDelta.col] = gameLogic.CONSTANTS.WHITE_KING;
            }
        }
        /*********************************************************************
         * 4. Check the set turn index or end match operation.
         ********************************************************************/
        winner = getWinner(board, turnIndexBeforeMove);
        var playerHasMoreJumpMoves = isAJumpMove &&
            getJumpMoves(board, toDelta, turnIndexBeforeMove).length > 0;
        var endMatchScores;
        var turnIndexAfterMove;
        if (winner !== '' && !playerHasMoreJumpMoves) {
            // Has a winner
            // Game over.
            turnIndexAfterMove = -1;
            endMatchScores = winner === gameLogic.CONSTANTS.WHITE ? [1, 0] : [0, 1];
        }
        else {
            // Game continues.
            endMatchScores = null;
            if (playerHasMoreJumpMoves) {
                if (!isToKingsRow || originalKind === gameLogic.CONSTANTS.KING) {
                    // If the same piece can make any more jump moves and it does
                    // not enter the kings row, then the next turn remains
                    // unchanged.
                    turnIndexAfterMove = turnIndexBeforeMove;
                }
                else {
                    // The piece can not make any more jump moves or it enters the
                    // kings row
                    turnIndexAfterMove = 1 - turnIndexBeforeMove;
                }
            }
            else {
                // The next turn will be the next player's if it's a simple move.
                turnIndexAfterMove = 1 - turnIndexBeforeMove;
            }
        }
        var stateAfterMove = { miniMoves: [{ fromDelta: fromDelta, toDelta: toDelta }], board: board };
        return { endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMiniMove = createMiniMove;
    function createMove(board, miniMoves, turnIndexBeforeMove) {
        if (miniMoves.length === 0)
            throw new Error("Must have at least one mini-move");
        var megaMove = null;
        for (var _i = 0, miniMoves_1 = miniMoves; _i < miniMoves_1.length; _i++) {
            var miniMove = miniMoves_1[_i];
            if (megaMove) {
                if (megaMove.turnIndexAfterMove !== turnIndexBeforeMove)
                    throw new Error("Mini-moves must be done by the same player");
            }
            megaMove = createMiniMove(board, miniMove.fromDelta, miniMove.toDelta, turnIndexBeforeMove);
            board = angular.copy(megaMove.stateAfterMove.board);
        }
        megaMove.stateAfterMove.miniMoves = miniMoves;
        return megaMove;
    }
    gameLogic.createMove = createMove;
    function createInitialMove() {
        return { endMatchScores: null, turnIndexAfterMove: 0,
            stateAfterMove: { miniMoves: [], board: getInitialBoard() } };
    }
    gameLogic.createInitialMove = createInitialMove;
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        var move = stateTransition.move;
        if (!stateBeforeMove && turnIndexBeforeMove === 0 &&
            angular.equals(createInitialMove(), move)) {
            return;
        }
        var stateAfterMove = move.stateAfterMove;
        var board = stateBeforeMove ? stateBeforeMove.board : null;
        var expectedMove = createMove(board, stateAfterMove.miniMoves, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
                ", but got stateTransition=" + angular.toJson(stateTransition, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
    /**
     * Return the initial board
     */
    function getInitialBoard() {
        return [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']];
    }
    gameLogic.getInitialBoard = getInitialBoard;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map
;
;
var game;
(function (game) {
    // http://graph.facebook.com/10152824135331125/picture?type=square
    // http://graph.facebook.com/10152824135331125/picture?type=large
    // http://graph.facebook.com/10153589934097337/picture?height=400&width=400
    game.isHelpModalShown = false;
    var CONSTANTS = gameLogic.CONSTANTS;
    var gameArea = null;
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.currentUpdateUI = null;
    game.board = null;
    game.shouldRotateBoard = false;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.humanMiniMoves = []; // We collect all the mini-moves into one mega-move.  
    game.lastHumanMove = null; // We don't animate moves we just made.
    game.remainingAnimations = [];
    game.animationInterval = null;
    // for drag-n-drop and ai move animations
    game.dndStartPos = null;
    game.dndElem = null;
    function getTranslations() {
        return {
            "CHECKERS_RULES_TITLE": {
                "en": "Rules of Checkers",
                "iw": "כללים של משחק דמקה",
                "pt": "Regras de Damas",
                "zh": "英国跳棋规则",
                "el": "Κανόνες Ντάμα",
                "fr": "Règles de Checkers",
                "hi": "चेकर्स के नियम",
                "es": "Reglas de Damas"
            },
            "CHECKERS_RULES_SLIDE1": {
                "en": "Regular pieces move one step diagonally forward.",
                "iw": "כל שחקן מניע בתורו אבן-משחק באלכסון",
                "pt": "pedaços regulares mover um passo na diagonal para a frente.",
                "zh": "定期件移动一步斜前方。",
                "el": "Η τακτική κομμάτια προχωρήσουμε ένα βήμα διαγώνια προς τα εμπρός.",
                "fr": "morceaux réguliers se déplacent d'un pas en diagonale avant.",
                "hi": "नियमित रूप से टुकड़े एक कदम तिरछे आगे बढ़ना है।",
                "es": "trozos regulares se mueven un paso en diagonal hacia delante."
            },
            "CHECKERS_RULES_SLIDE2": {
                "en": "A regular piece becomes a king when it reaches the final row. A king can also move backwards.",
                "iw": "כשאבן משחק מגיעה לשורה האחרונה, היא הופכת להיות \"מלך\". מלך, בניגוד לאבן רגילה, יכול לנוע לכל הכיוונים באלכסון (כלומר גם אחורה).",
                "pt": "Um pedaço comum torna-se um rei quando se atinge a linha final. Um rei também pode se mover para trás.",
                "zh": "定期一块变成一个国王，当它到达最后一排。 A君也可以向后移动。",
                "el": "Μια τακτική κομμάτι γίνεται βασιλιάς όταν φτάσει την τελική γραμμή. Ένας βασιλιάς μπορεί επίσης να κινηθεί προς τα πίσω.",
                "fr": "Un morceau régulier devient un roi quand il atteint la dernière rangée. Un roi peut également se déplacer vers l'arrière.",
                "hi": "एक नियमित रूप से टुकड़े के एक राजा जब यह अंतिम पंक्ति तक पहुँचता हो जाता है। एक राजा भी पीछे की ओर स्थानांतरित कर सकते हैं।",
                "es": "Una pieza normal se convierte en un rey cuando se llega a la última fila. Un rey puede moverse hacia atrás."
            },
            "CHECKERS_RULES_SLIDE3": {
                "en": "Capturing is done jumping over adjacent opponent pieces. It's mandatory! Multiple successive jumps can zigzag, i.e., change diagonal direction.",
                "iw": "דילוג (או אכילה) מתבצע כאשר אבן משחק מונחת במשבצת סמוכה לאבן היריב, ומעבר לאבן היריב יש מקום פנוי. כאשר דילוג אפשרי, חובה לבצע אותו.",
                "pt": "Captura é feita a saltar sobre as peças oponente adjacentes. É obrigatório! Múltiplos saltos sucessivos pode ziguezague, ou seja, mudar de direção diagonal.",
                "zh": "捕获完成后跳过相邻的对手件。这是强制性的！多个连续跳跃可以曲折，即改变对角线方向。",
                "el": "Σύλληψη γίνεται άλμα πάνω από παρακείμενα κομμάτια του αντιπάλου. Είναι υποχρεωτική! Πολλαπλές διαδοχικές άλματα μπορεί να ζιγκ-ζαγκ, δηλαδή, να αλλάξει διαγώνια κατεύθυνση.",
                "fr": "Capturing se fait sauter sur des morceaux adversaire adjacents. Il est obligatoire! sauts successifs multiples peuvent zigzag, à savoir, changer de direction diagonale.",
                "hi": "कैप्चरिंग आसन्न प्रतिद्वंद्वी टुकड़े पर कूद किया जाता है। यह अनिवार्य है! एकाधिक लगातार कूदता है, वक्र कर सकते हैं जैसे कि, विकर्ण दिशा बदल जाते हैं।",
                "es": "La captura se realiza saltando sobre las piezas adyacentes oponente. ¡Es obligatorio! saltos sucesivos múltiples pueden zigzag, es decir, cambiar de dirección diagonal."
            },
            "CHECKERS_RULES_SLIDE4": {
                "en": "A player that can't move or lost all its pieces, loses the game.",
                "iw": "שחקן שלא יכול לזוז או שאיבד את כל האבנים, מפסיד את המשחק.",
                "pt": "Um jogador que não pode se mover ou perdido todas as suas peças, perde o jogo.",
                "zh": "不能移动或丧失其所有作品的球员，失去了比赛。",
                "el": "Ένας παίκτης που δεν μπορεί να κινηθεί ή να χάσει όλα τα κομμάτια του, χάνει το παιχνίδι.",
                "fr": "Un joueur qui ne peut pas se déplacer ou perdu toutes ses pièces, perd la partie.",
                "hi": "एक खिलाड़ी है कि स्थानांतरित करने या खो नहीं कर सकते हैं अपने सभी टुकड़े, खेल खो देता है।",
                "es": "Un jugador que no se puede mover o perdido todas sus piezas, pierde el juego."
            },
            "CHECKERS_CLOSE": {
                "en": "Close",
                "iw": "סגור",
                "pt": "Fechar",
                "zh": "继续游戏",
                "el": "Κοντά",
                "fr": "Fermer",
                "hi": "बंद करे",
                "es": "Cerrar"
            },
        };
    }
    function init() {
        log.alwaysLog("Checkers version 1.1");
        gameArea = document.getElementById("gameArea");
        if (!gameArea)
            throw new Error("Can't find gameArea div!");
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        console.log("Translation of 'CHECKERS_RULES_TITLE' is " + translate('CHECKERS_RULES_TITLE'));
        resizeGameAreaService.setWidthToHeight(1);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI
        });
        dragAndDropService.addDragListener("gameArea", handleDragEvent);
    }
    game.init = init;
    function clearAnimationInterval() {
        if (game.animationInterval) {
            $interval.cancel(game.animationInterval);
            game.animationInterval = null;
        }
    }
    function advanceToNextAnimation() {
        if (game.remainingAnimations.length == 0) {
            // The computer makes a move one tick (0.6sec) after the animations finished, to avoid stress on the UI thread.
            clearAnimationInterval();
            maybeSendComputerMove();
            return;
        }
        var miniMove = game.remainingAnimations.shift();
        var iMove = gameLogic.createMiniMove(game.board, miniMove.fromDelta, miniMove.toDelta, game.currentUpdateUI.turnIndexBeforeMove);
        game.board = iMove.stateAfterMove.board;
        if (game.remainingAnimations.length == 0) {
            // Checking we got to the final correct board
            var expectedBoard = game.currentUpdateUI.move.stateAfterMove.board;
            if (!angular.equals(game.board, expectedBoard)) {
                throw new Error("Animations ended in a different board: expected=" + angular.toJson(expectedBoard, true) + " actual after animations=" + angular.toJson(game.board, true));
            }
        }
    }
    /**
     * This method update the game's UI.
     * @param params
     */
    // for drag-n-drop and ai move animations
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.didMakeMove = false; // Only one move per updateUI
        game.currentUpdateUI = params;
        clearDragNDrop();
        game.humanMiniMoves = [];
        // We show animations if it's a non-human move or a move made by our opponents.
        // The move in multiplayer game have slightly different endMatchScores:
        // "endMatchScores":null  vs completley missing endMatchScores.
        // It's enought to check stateAfterMove anyway.
        var shouldAnimate = !game.lastHumanMove || !angular.equals(params.move.stateAfterMove, game.lastHumanMove.stateAfterMove);
        game.lastHumanMove = null;
        //Rotate the board 180 degrees, hence in the point of current
        //player's view, the board always face towards him/her;
        game.shouldRotateBoard = params.playMode === 1;
        clearAnimationInterval();
        game.remainingAnimations = [];
        if (isFirstMove()) {
            game.board = gameLogic.getInitialBoard();
            if (isMyTurn())
                makeMove(gameLogic.createInitialMove());
        }
        else if (!shouldAnimate) {
            game.board = params.move.stateAfterMove.board;
            game.animationInterval = $interval(advanceToNextAnimation, 600); // I want to make the AI move in 0.6 seconds (to not pause the UI thread for too long)
        }
        else {
            // params.stateBeforeMove is null only in the 2nd move
            // (and there are no animations to show in the initial move since we're simply setting the board)
            game.board = params.stateBeforeMove ? params.stateBeforeMove.board : params.move.stateAfterMove.board;
            // TODO: temporary code because I changed this logic on May 2016 (delete in August).
            if (!params.stateBeforeMove && !angular.equals(game.board, gameLogic.getInitialBoard()))
                game.board = gameLogic.getInitialBoard();
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.  
            game.remainingAnimations = angular.copy(params.move.stateAfterMove.miniMoves);
            game.animationInterval = $interval(advanceToNextAnimation, 600);
        }
    }
    game.updateUI = updateUI;
    function maybeSendComputerMove() {
        if (!isComputerTurn())
            return;
        var move = aiService.createComputerMove(game.board, yourPlayerIndex(), { millisecondsLimit: 500 });
        log.info("Computer move: ", move);
        makeMove(move);
    }
    function makeMove(move) {
        if (game.didMakeMove) {
            return;
        }
        game.didMakeMove = true;
        moveService.makeMove(move);
    }
    function isFirstMove() {
        return !game.currentUpdateUI.move.stateAfterMove;
    }
    function yourPlayerIndex() {
        return game.currentUpdateUI.yourPlayerIndex;
    }
    function isComputer() {
        var playerInfo = game.currentUpdateUI.playersInfo[game.currentUpdateUI.yourPlayerIndex];
        return playerInfo && playerInfo.playerId === '';
    }
    function isComputerTurn() {
        return isMyTurn() && isComputer();
    }
    function isHumanTurn() {
        return isMyTurn() && !isComputer() &&
            game.remainingAnimations.length == 0; // you can only move after all animations are over.
    }
    function isMyTurn() {
        return !game.didMakeMove &&
            game.currentUpdateUI.move.turnIndexAfterMove >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.move.turnIndexAfterMove; // it's my turn
    }
    function getAnimationClassFromIdDiff(idDiff) {
        switch (idDiff) {
            case CONSTANTS.COLUMN + 1:
                return 'move_up_left';
            case CONSTANTS.COLUMN - 1:
                return 'move_up_right';
            case -CONSTANTS.COLUMN + 1:
                return 'move_down_left';
            case -CONSTANTS.COLUMN - 1:
                return 'move_down_right';
            case (2 * CONSTANTS.COLUMN) + 2:
                return 'jump_up_left';
            case (2 * CONSTANTS.COLUMN) - 2:
                return 'jump_up_right';
            case -(2 * CONSTANTS.COLUMN) + 2:
                return 'jump_down_left';
            case -(2 * CONSTANTS.COLUMN) - 2:
                return 'jump_down_right';
        }
        log.error("Internal error: illegal idDiff=", idDiff);
        return "";
    }
    function getAnimationClass(row, col) {
        if (game.remainingAnimations.length == 0)
            return ""; // No animations to show.
        var fromDelta = game.remainingAnimations[0].fromDelta;
        var toDelta = game.remainingAnimations[0].toDelta;
        var middleDelta = { row: (fromDelta.row + toDelta.row) / 2, col: (fromDelta.col + toDelta.col) / 2 };
        var rotatedDelta = rotate({ row: row, col: col });
        if (fromDelta.row === rotatedDelta.row && fromDelta.col === rotatedDelta.col) {
            var fromIdx = toIndex(fromDelta.row, fromDelta.col);
            var toIdx = toIndex(toDelta.row, toDelta.col);
            var idDiff = fromIdx - toIdx;
            return getAnimationClassFromIdDiff(game.shouldRotateBoard ? -idDiff : idDiff);
        }
        else if (middleDelta.row === rotatedDelta.row && middleDelta.col === rotatedDelta.col) {
            // It's a jump move and this piece is being eaten.
            return "explodePiece";
        }
        else {
            return "";
        }
    }
    game.getAnimationClass = getAnimationClass;
    function makeMiniMove(fromDelta, toDelta) {
        log.info("makeMiniMove from:", fromDelta, " to: ", toDelta);
        if (!isHumanTurn()) {
            return;
        }
        // We collect minimoves and make a mega one.
        var miniMove = { fromDelta: fromDelta, toDelta: toDelta };
        var nextMove = null;
        try {
            nextMove = gameLogic.createMove(game.board, [miniMove], yourPlayerIndex());
        }
        catch (e) {
            log.info(["Move is illegal:", e]);
            return;
        }
        // Move is legal, make it!
        $rootScope.$apply(function () {
            game.board = nextMove.stateAfterMove.board;
            game.humanMiniMoves.push(miniMove);
            // We finished our mega-move if it's now someone elses turn or game ended.
            if (nextMove.turnIndexAfterMove !== game.currentUpdateUI.move.turnIndexAfterMove) {
                game.lastHumanMove = nextMove = gameLogic.createMove(game.currentUpdateUI.move.stateAfterMove.board, game.humanMiniMoves, yourPlayerIndex());
                makeMove(game.lastHumanMove);
            }
        });
    }
    /**
     * Convert the delta to UI state index
     */
    function toIndex(row, col) {
        return row * CONSTANTS.COLUMN + col;
    }
    /**
     * Check if it is a dark cell.
     */
    function isDarkCell(row, col) {
        return (row + col) % 2 == 1;
    }
    game.isDarkCell = isDarkCell;
    /**
     * Rotate 180 degrees by simply convert the row and col number for UI.
     */
    function rotate(delta) {
        if (game.shouldRotateBoard) {
            // Zero based
            return {
                row: CONSTANTS.ROW - delta.row - 1,
                col: CONSTANTS.COLUMN - delta.col - 1
            };
        }
        return delta;
    }
    function getPiece(row, col) {
        var rotatedDelta = rotate({ row: row, col: col });
        return game.board[rotatedDelta.row][rotatedDelta.col];
    }
    // If any of the images has a loading error, we're probably offline, so we turn off the avatar customization.
    game.hadLoadingError = false;
    function onImgError() {
        if (game.hadLoadingError)
            return;
        game.hadLoadingError = true;
        $rootScope.$apply();
    }
    game.onImgError = onImgError;
    function isLocalTesting() { return location.protocol === "file:"; }
    function hasAvatarImgUrl(avatarImageUrl) {
        return avatarImageUrl && avatarImageUrl.indexOf('imgs/autoMatchAvatar.png') === -1;
    }
    function getBoardAvatar() {
        if (game.hadLoadingError)
            return '';
        // For local testing
        if (isLocalTesting())
            return "http://graph.facebook.com/10153589934097337/picture?height=300&width=300";
        var myPlayerInfo = game.currentUpdateUI.playersInfo[yourPlayerIndex()];
        if (!myPlayerInfo)
            return '';
        var myAvatar = myPlayerInfo.avatarImageUrl;
        if (!hasAvatarImgUrl(myAvatar))
            return '';
        // I only do it for FB users
        var match = myAvatar.match(/graph[.]facebook[.]com[/](\w+)[/]/);
        if (!match)
            return '';
        var myFbUserId = match[1];
        return "http://graph.facebook.com/" + myFbUserId + "/picture?height=300&width=300";
    }
    game.getBoardAvatar = getBoardAvatar;
    function getBoardClass() {
        return game.hadLoadingError ? '' : 'transparent_board';
    }
    game.getBoardClass = getBoardClass;
    function getPieceContainerClass(row, col) {
        return getAnimationClass(row, col);
    }
    game.getPieceContainerClass = getPieceContainerClass;
    function getSquareClass(row, col) {
        if (!game.dndStartPos) {
            if (!canDrag({ row: row, col: col }))
                return '';
            return 'can_drag_from_square';
        }
        // Dragging now, let's find if you can drop there.
        var fromDelta = rotate({ row: game.dndStartPos.row, col: game.dndStartPos.col });
        var toDelta = rotate({ row: row, col: col });
        if (!isHumanTurn()) {
            return '';
        }
        var miniMove = { fromDelta: fromDelta, toDelta: toDelta };
        try {
            gameLogic.createMove(game.board, [miniMove], yourPlayerIndex());
            return 'can_drop_on_square';
        }
        catch (e) {
        }
        return '';
    }
    game.getSquareClass = getSquareClass;
    function getPieceClass(row, col) {
        var avatarPieceSrc = getAvatarPieceSrc(row, col);
        var avatarPieceClass = '';
        if (avatarPieceSrc) {
            var piece = getPiece(row, col);
            var pieceColor = gameLogic.getColor(piece);
            avatarPieceClass = ' avatar_piece ' +
                // Black&white are reversed in the UI because black should start. 
                (pieceColor === CONSTANTS.BLACK ? 'lighter_avatar_piece' : 'darker_avatar_piece');
        }
        return "piece " + avatarPieceClass;
    }
    game.getPieceClass = getPieceClass;
    function getAvatarPieceSrc(row, col) {
        if (game.hadLoadingError)
            return '';
        var piece = getPiece(row, col);
        if (piece == '--' || piece == 'DS')
            return '';
        var pieceColor = gameLogic.getColor(piece);
        var pieceColorIndex = pieceColor === CONSTANTS.BLACK ? 1 : 0;
        var myPlayerInfo = game.currentUpdateUI.playersInfo[pieceColorIndex];
        if (!myPlayerInfo)
            return '';
        var avatarImageUrl = myPlayerInfo.avatarImageUrl;
        return hasAvatarImgUrl(avatarImageUrl) ? avatarImageUrl :
            !isLocalTesting() ? '' :
                pieceColorIndex == 1 ? "http://graph.facebook.com/10153589934097337/picture" : "http://graph.facebook.com/10153693068502449/picture";
    }
    game.getAvatarPieceSrc = getAvatarPieceSrc;
    function getPieceSrc(row, col) {
        var avatarPieceSrc = getAvatarPieceSrc(row, col);
        if (avatarPieceSrc)
            return avatarPieceSrc;
        var piece = getPiece(row, col);
        var dir = 'imgs/';
        var ext = '.png';
        switch (piece) {
            case 'BM':
                return dir + 'black_man' + ext;
            case 'BK':
                return dir + 'black_cro' + ext;
            case 'WM':
                return dir + 'white_man' + ext;
            case 'WK':
                return dir + 'white_cro' + ext;
        }
        return '';
    }
    game.getPieceSrc = getPieceSrc;
    function clearDragNDrop() {
        game.dndStartPos = null;
        if (game.dndElem)
            game.dndElem.removeAttribute("style");
        game.dndElem = null;
    }
    function handleDragEvent(type, cx, cy) {
        var cellSize = getCellSize();
        // Make sure the player can not drag the piece outside of the board
        var x = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
        var y = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);
        var dndPos = {
            top: y - cellSize.height * 0.605,
            left: x - cellSize.width * 0.605
        };
        if (type === 'touchmove') {
            // Dragging around
            if (game.dndStartPos)
                setDndElemPos(dndPos, cellSize);
            return;
        }
        var delta = {
            row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
            col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
        };
        if (type === "touchstart") {
            // If a piece is dragged, store the piece element
            if (canDrag(delta)) {
                game.dndStartPos = delta;
                game.dndElem = document.getElementById("img_container_" + game.dndStartPos.row + "_" + game.dndStartPos.col);
                var style = game.dndElem.style;
                style['z-index'] = 20;
                // Slightly bigger shadow (as if it's closer to you).
                //.piece class used to have:
                // -webkit-filter: brightness(100%) drop-shadow(0.1rem 0.1rem 0.1rem black);
                // filter: brightness(100%) drop-shadow(0.1rem 0.1rem 0.1rem black);
                // but it's making animations&dragging very slow, even on iphone6.
                //let filter = "brightness(100%) drop-shadow(0.3rem 0.3rem 0.1rem black)";
                //style['filter'] = filter;
                //style['-webkit-filter'] = filter;
                var transform = "scale(1.2)"; // make it slightly bigger (as if it's closer to the person dragging)
                style['transform'] = transform;
                style['-webkit-transform'] = transform;
                setDndElemPos(dndPos, cellSize);
                $rootScope.$apply(); // To show the droppable squares, see .can_drop_on_square
            }
            return;
        }
        if (type === "touchend" && game.dndStartPos) {
            // Drop a piece
            var from = { row: game.dndStartPos.row, col: game.dndStartPos.col };
            var to = { row: delta.row, col: delta.col };
            makeMiniMove(rotate(from), rotate(to));
            setDndElemPos(getCellPos(game.dndStartPos.row, game.dndStartPos.col, cellSize), cellSize);
            clearDragNDrop();
        }
        // Clean up
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            clearDragNDrop();
            $rootScope.$apply(); // To show the draggable squares, see .can_drag_from_square
        }
    }
    /**
     * Check if the piece in the delta position has the own color.
     */
    function isOwnColor(delta) {
        return gameLogic.isOwnColor(yourPlayerIndex(), game.board[delta.row][delta.col].substring(0, 1));
    }
    /**
     * Check if the piece can be dragged.
     */
    function canDrag(delta) {
        var rotatedDelta = rotate(delta);
        if (!isHumanTurn() || !isOwnColor(rotatedDelta))
            return false;
        if (!gameLogic.isOwnColor(yourPlayerIndex(), game.board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
            return false;
        }
        var hasMandatoryJump = gameLogic.hasMandatoryJumps(game.board, yourPlayerIndex());
        var possibleMoves;
        if (hasMandatoryJump) {
            possibleMoves = gameLogic
                .getJumpMoves(game.board, rotatedDelta, yourPlayerIndex());
        }
        else {
            possibleMoves = gameLogic
                .getSimpleMoves(game.board, rotatedDelta, yourPlayerIndex());
        }
        return possibleMoves.length > 0;
    }
    /**
     * Set the TopLeft of the element.
     */
    function setDndElemPos(pos, cellSize) {
        var top = cellSize.height / 10;
        var left = cellSize.width / 10;
        var originalSize = getCellPos(game.dndStartPos.row, game.dndStartPos.col, cellSize);
        if (game.dndElem !== null) {
            game.dndElem.style.left = (pos.left - originalSize.left + left) + "px";
            game.dndElem.style.top = (pos.top - originalSize.top + top) + "px";
        }
    }
    /**
     * Get the position of the cell.
     */
    function getCellPos(row, col, cellSize) {
        var top = row * cellSize.height;
        var left = col * cellSize.width;
        var pos = { top: top, left: left };
        return pos;
    }
    /**
     * Get the size of the cell.
     */
    function getCellSize() {
        return {
            width: gameArea.clientWidth / CONSTANTS.COLUMN,
            height: gameArea.clientHeight / CONSTANTS.ROW
        };
    }
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map
;
var aiService;
(function (aiService) {
    var CONSTANTS = gameLogic.CONSTANTS;
    /***********************************************************************
     * Heuristic part
     **********************************************************************/
    /**
     * Get the square value.
     * For man, the value is 5.
     * For man which close to be crowned (1 simple move), the value is 7.
     * For crown, the value is 10.
     *
     * @param square the square info. e.g. 'WMAN', 'BCRO'.
     * @param squareIndex the square index.
     * @returns {number} the square value.
     */
    function getSquareValue(square, row, col) {
        if (gameLogic.getKind(square) === CONSTANTS.MAN) {
            if (gameLogic.getColor(square) === CONSTANTS.WHITE) {
                // White
                if (row === 1) {
                    // Closed to be crowned
                    return 7;
                }
                return 5;
            }
            // Black
            if (col === CONSTANTS.ROW - 2) {
                // Closed to be crowned
                return 7;
            }
            return 5;
        }
        if (gameLogic.getKind(square) === CONSTANTS.KING) {
            // It's a crown
            return 10;
        }
        // Empty square
        return 0;
    }
    /**
     * Get the board value.
     *
     * @param board the game API board.
     * @param turnIndex 0 represents the black player and 1
     *        represents the white player.
     * @returns {*} the board value.
     */
    function getStateValue(board, turnIndex) {
        var stateValue = 0, winner, 
        // For different position of the board, there's a different weight.
        boardWeight = [
            [0, 4, 0, 4, 0, 4, 0, 4],
            [4, 0, 3, 0, 3, 0, 3, 0],
            [0, 3, 0, 2, 0, 2, 0, 4],
            [4, 0, 2, 0, 1, 0, 3, 0],
            [0, 3, 0, 1, 0, 2, 0, 4],
            [4, 0, 2, 0, 2, 0, 3, 0],
            [0, 3, 0, 3, 0, 3, 0, 4],
            [4, 0, 4, 0, 4, 0, 4, 0]
        ], cell, squareValue, row, col;
        winner = gameLogic.getWinner(board, turnIndex);
        if (winner === CONSTANTS.WHITE) {
            return Number.MIN_VALUE;
        }
        if (winner === CONSTANTS.BLACK) {
            return Number.MAX_VALUE;
        }
        for (row = 0; row < CONSTANTS.ROW; row += 1) {
            for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                cell = board[row][col];
                if (cell !== CONSTANTS.LIGHT_SQUARE &&
                    cell !== CONSTANTS.DARK_SQUARE) {
                    // Get the square value which equals to the square value
                    // multiply the board weight.
                    squareValue = getSquareValue(cell, row, col) *
                        boardWeight[row][col];
                    if (gameLogic.getColor(cell) ===
                        CONSTANTS.BLACK) {
                        // BLACK
                        stateValue += squareValue;
                    }
                    else {
                        // WHITE
                        stateValue -= squareValue;
                    }
                }
            }
        }
        return stateValue;
    }
    /**
     * Get the state score for player 0, a simple wrapper function
     */
    function getStateScoreForIndex0(move, turnIndex) {
        // getStateValue return the score for player 1.
        return -getStateValue(move.stateAfterMove.board, turnIndex);
    }
    function addMegaJumpMoves(allPossibleMoves, board, turnIndex, from) {
        var possibleMoves = gameLogic.getJumpMoves(board, from, turnIndex);
        for (var _i = 0, possibleMoves_1 = possibleMoves; _i < possibleMoves_1.length; _i++) {
            var possibleMove = possibleMoves_1[_i];
            var miniMove = [];
            var currentPos = from;
            var nextPos = possibleMove;
            var currentBoard = board;
            // Finishing the jump if there are still mandatory jumps.
            do {
                var iMove = gameLogic.createMiniMove(currentBoard, currentPos, nextPos, turnIndex);
                miniMove.push({ fromDelta: currentPos, toDelta: nextPos });
                // If the turn changes, then there are no more mandatory jumps
                if (iMove.turnIndexAfterMove !== turnIndex)
                    break;
                // We need to make another jump: update currentBoard, currentPos, nextPos
                currentBoard = iMove.stateAfterMove.board;
                currentPos = nextPos;
                nextPos = gameLogic.getJumpMoves(currentBoard, nextPos, turnIndex)[0]; // Just take the first possible jump move
            } while (true);
            allPossibleMoves.push(miniMove);
        }
    }
    /**
     * Get all possible moves.
     */
    function getAllMoves(board, turnIndex) {
        var allPossibleMoves = [];
        var hasMandatoryJump = gameLogic.hasMandatoryJumps(board, turnIndex);
        // Check each square of the board
        for (var row = 0; row < CONSTANTS.ROW; row += 1) {
            for (var col = 0; col < CONSTANTS.COLUMN; col += 1) {
                if (gameLogic.isOwnColor(turnIndex, board[row][col].substr(0, 1))) {
                    var delta = { row: row, col: col };
                    if (hasMandatoryJump) {
                        addMegaJumpMoves(allPossibleMoves, board, turnIndex, delta);
                    }
                    else {
                        // If there's no mandatory jump,
                        // then check the possible simple move
                        var possibleMoves = gameLogic.getSimpleMoves(board, delta, turnIndex);
                        for (var _i = 0, possibleMoves_2 = possibleMoves; _i < possibleMoves_2.length; _i++) {
                            var possibleMove = possibleMoves_2[_i];
                            allPossibleMoves.push([{ fromDelta: delta, toDelta: possibleMove }]);
                        }
                    }
                }
            }
        }
        return allPossibleMoves;
    }
    /**
     * Get the next state which is extracted from the move operations.
     */
    function getNextStates(move, playerIndex) {
        var board = move.stateAfterMove.board;
        var allPossibleMoveDeltas = getAllMoves(board, playerIndex);
        var allPossibleMoves = [];
        for (var i = 0; i < allPossibleMoveDeltas.length; i++) {
            allPossibleMoves[i] = gameLogic.createMove(angular.copy(board), allPossibleMoveDeltas[i], playerIndex);
        }
        return allPossibleMoves;
    }
    /***********************************************************************
     * Service part...
     **********************************************************************/
    /**
     * Returns the move that the computer player should do for the given board.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(board, playerIndex, alphaBetaLimits) {
        return alphaBetaService.alphaBetaDecision({ stateAfterMove: { board: board ? board : gameLogic.getInitialBoard(), miniMoves: [] },
            endMatchScores: null, turnIndexAfterMove: null }, playerIndex, getNextStates, getStateScoreForIndex0, 
        // If you want to see debugging output in the console, then pass
        // getDebugStateToString instead of null
        null, 
        //getDebugStateToString,
        alphaBetaLimits);
    }
    aiService.createComputerMove = createComputerMove;
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map