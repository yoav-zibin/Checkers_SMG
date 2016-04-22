describe('gameLogic unit tests:', function () {
    var OK = true;
    var ILLEGAL = false;
    var NO_ONE_TURN = -1;
    var NO_ONE_WINS = null;
    var WHITE_TURN_INDEX = 0;
    var BLACK_TURN_INDEX = 1;
    var WHITE_WIN_SCORES = [1, 0];
    var BLACK_WIN_SCORES = [0, 1];
    var emptyBoard = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    /*
    * FIRST STATE SCENARIO - WHITE (Black first move: [2, 1] -> [3, 0])
    *
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
    * 1:odd    ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
    * 2:even   ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
    * 3:odd    ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 5:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
    * 6:even   ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
    * 7:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']]
    */
    var secondState = [
        ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
        ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
        ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
        ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
    ];
    /*
    * MANDATORY JUMP SCENARIO - BLACK
    * board[2][3] = CONSTANTS.WHITE_MAN;
    * board[3][2] = CONSTANTS.BLACK_KING;
    * board[4][5] = CONSTANTS.BLACK_MAN;
    * board[5][4] = CONSTANTS.WHITE_KING;
    *
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 2:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
    * 3:odd    ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
    * 5:odd    ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
    * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
    */
    var mandatoryJumpForBlack = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    /*
        * MANDATORY JUMP SCENARIO - WHITE
          testState.board[3][2] = CONSTANTS.WHITE_MAN;
          testState.board[2][3] = CONSTANTS.BLACK_KING;
          testState.board[5][4] = CONSTANTS.BLACK_MAN;
          testState.board[4][5] = CONSTANTS.WHITE_KING;
        *
        *             0     1     2     3     4     5     6     7
        * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        * 2:even   ['--', 'DS', '--', 'BK', '--', 'DS', '--', 'DS'],
        * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
        * 4:even   ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
        * 5:odd    ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
        * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
        */
    var mandatoryJumpForWhite = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'BK', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    function checkAiService(board, playerIndex) {
        // Also check aiService
        var start = new Date().getMilliseconds();
        var move = aiService.createComputerMove(board, playerIndex, { maxDepth: 2 });
        var end = new Date().getMilliseconds();
        console.log("Finding AI move took " + (end - start) + " millis");
        gameLogic.checkMoveOk({
            turnIndexBeforeMove: playerIndex,
            stateBeforeMove: board ? { board: board, miniMoves: [] } : null,
            move: move,
            numberOfPlayers: null
        });
    }
    function expectMegaMove(isOk, turnIndexBeforeMove, boardBeforeMove, miniMoves, boardAfterMove, turnIndexAfterMove, endMatchScores) {
        var stateTransition = {
            turnIndexBeforeMove: turnIndexBeforeMove,
            stateBeforeMove: boardBeforeMove ? { board: boardBeforeMove, miniMoves: [] } : null,
            move: {
                turnIndexAfterMove: turnIndexAfterMove,
                endMatchScores: endMatchScores,
                stateAfterMove: { board: boardAfterMove, miniMoves: miniMoves }
            },
            numberOfPlayers: null
        };
        if (isOk) {
            gameLogic.checkMoveOk(stateTransition);
            checkAiService(stateTransition.stateBeforeMove ? stateTransition.stateBeforeMove.board : null, turnIndexBeforeMove);
        }
        else {
            // We expect an exception to be thrown :)
            var didThrowException = false;
            try {
                gameLogic.checkMoveOk(stateTransition);
            }
            catch (e) {
                didThrowException = true;
            }
            if (!didThrowException) {
                throw new Error("We expect an illegal move, but checkMoveOk didn't throw any exception!");
            }
        }
    }
    function expectMove(isOk, turnIndexBeforeMove, boardBeforeMove, fromDelta, toDelta, boardAfterMove, turnIndexAfterMove, endMatchScores) {
        expectMegaMove(isOk, turnIndexBeforeMove, boardBeforeMove, [{ fromDelta: fromDelta, toDelta: toDelta }], boardAfterMove, turnIndexAfterMove, endMatchScores);
    }
    // White ('WM' and 'WK') is player index 0, and 0 goes first,
    // However in English draughts the black/red goes first (so in the UI I switched between white&black).
    it("[5, 4] -> [4, 5]: white regular move.", function () {
        expectMove(OK, WHITE_TURN_INDEX, null, { row: 5, col: 4 }, { row: 4, col: 5 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'WM', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'DS', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    it("[2, 1] -> [3, 0]", function () {
        expectMove(OK, BLACK_TURN_INDEX, null, { row: 2, col: 1 }, { row: 3, col: 0 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[2, 1] -> [3, 4]: Illegal because it can only move one square" +
        "diagonally to an adjacent unoccupied dark square.", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 2, col: 1 }, { row: 3, col: 4 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[2, 1] -> [4, 1]: Illegal because it can only move one square" +
        "diagonally to an adjacent unoccupied dark square.", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 2, col: 1 }, { row: 4, col: 1 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[2, 1] -> [1, 0]: Illegal because MAN can not move backward", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 2, col: 1 }, { row: 1, col: 0 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[1, 0] -> [2, 1]: Illegal because 4 is occupied", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 1, col: 0 }, { row: 2, col: 1 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 0] -> [4, 1]: Illegal because the player can only move" +
        "his/her own pieces", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 5, col: 0 }, { row: 4, col: 1 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[?, ?] -> [3, 0]: Illegal because the piece does not exist", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, null, { row: 8, col: 8 }, { row: 3, col: 0 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 0] -> [4, 1]", function () {
        expectMove(OK, WHITE_TURN_INDEX, secondState, { row: 5, col: 0 }, { row: 4, col: 1 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 0] -> [4, 3]: Illegal because it can only move one square" +
        "diagonally to an adjacent unoccupied dark square.", function () {
        expectMove(ILLEGAL, WHITE_TURN_INDEX, secondState, { row: 5, col: 0 }, { row: 4, col: 3 }, [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    it("[3, 2] -> [2, 3] -> [1, 4]", function () {
        expectMove(OK, BLACK_TURN_INDEX, mandatoryJumpForBlack, { row: 3, col: 2 }, { row: 1, col: 4 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[4, 5] -> [5, 4] -> [6, 3]", function () {
        expectMove(OK, BLACK_TURN_INDEX, mandatoryJumpForBlack, { row: 4, col: 5 }, { row: 6, col: 3 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[3, 2] -> [2, 1]: Illegal because 13 ignores the mandatory jump", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, mandatoryJumpForBlack, { row: 3, col: 2 }, { row: 2, col: 1 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BK', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[4, 5] -> [5, 6]: Illegal because 18 ignores the mandatory jump", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, mandatoryJumpForBlack, { row: 4, col: 5 }, { row: 5, col: 6 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WK', '--', 'BM', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[3, 2] -> [2, 3] -> [1, 4]", function () {
        expectMove(OK, WHITE_TURN_INDEX, mandatoryJumpForWhite, { row: 3, col: 2 }, { row: 1, col: 4 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    it("Mega-move: double jump by black", function () {
        expectMegaMove(OK, BLACK_TURN_INDEX, [
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--']
        ], [{ fromDelta: { row: 0, col: 1 }, toDelta: { row: 2, col: 3 } },
            { fromDelta: { row: 2, col: 3 }, toDelta: { row: 4, col: 1 } }], [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("Mega-move: triple jump by white ends the game", function () {
        expectMegaMove(OK, WHITE_TURN_INDEX, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], [{ fromDelta: { row: 6, col: 3 }, toDelta: { row: 4, col: 5 } },
            { fromDelta: { row: 4, col: 5 }, toDelta: { row: 2, col: 3 } },
            { fromDelta: { row: 2, col: 3 }, toDelta: { row: 0, col: 1 } }], [
            ['--', 'WK', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], NO_ONE_TURN, WHITE_WIN_SCORES);
    });
    /*
    * CROWNED SCENARIO - BLACK
      testState.board[3][2] = CONSTANTS.BLACK_MAN;
      testState.board[5][2] = CONSTANTS.BLACK_MAN;
      testState.board[6][1] = CONSTANTS.BLACK_MAN;
      testState.board[7][6] = CONSTANTS.WHITE_MAN;
    *
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 3:odd    ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'WM?','--', 'DS', '--', 'DS'],
    * 5:odd    ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
    * 6:even   ['--', 'BM', '--', 'WM?','--', 'DS', '--', 'DS'],
    * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']]
    *
    * Note: piece with '?' mean the piece exist for certain test case in
    *       order to prevent the influence of mandatory jump.
    */
    var crownedScenario1 = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']
    ];
    it("[6, 1] -> [7, 0]*", function () {
        expectMove(OK, BLACK_TURN_INDEX, crownedScenario1, { row: 6, col: 1 }, { row: 7, col: 0 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['BK', '--', 'DS', '--', 'DS', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    var crownedScenario2 = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'BM', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']
    ];
    it("[5, 2] -> [6, 3] -> [7, 4]*", function () {
        expectMove(OK, BLACK_TURN_INDEX, crownedScenario2, { row: 5, col: 2 }, { row: 7, col: 4 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BK', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 2] -> [6, 3]: regular move", function () {
        expectMove(OK, BLACK_TURN_INDEX, crownedScenario1, { row: 5, col: 2 }, { row: 6, col: 3 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'BM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 2] -> [6, 3]*: Illegal because it does not move to the final" +
        "row in order to be crowned", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, crownedScenario1, { row: 5, col: 2 }, { row: 6, col: 3 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'BK', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    /*
    * CROWNED SCENARIO - WHITE
    testState.board[1][2] = CONSTANTS.WHITE_MAN;
    testState.board[2][3] = CONSTANTS.WHITE_MAN;
    testState.board[4][3] = CONSTANTS.WHITE_MAN;
    testState.board[0][7] = CONSTANTS.BLACK_MAN;
    *
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
    * 1:odd    ['DS', '--', 'WM', '--', 'BM?','--', 'DS', '--'],
    * 2:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
    * 3:odd    ['DS', '--', 'DS', '--', 'BM?','--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
    * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
    *
    * Note: piece with '?' mean the piece exist for certain test case in
    *       order to prevent the influence of mandatory jump.
    */
    var crownedScenario3 = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
        ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[1, 2] -> [0, 3]*", function () {
        expectMove(OK, WHITE_TURN_INDEX, crownedScenario3, { row: 1, col: 2 }, { row: 0, col: 3 }, [
            ['--', 'DS', '--', 'WK', '--', 'DS', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    var crownedScenario4 = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
        ['DS', '--', 'WM', '--', 'BM', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[2, 3] -> [1, 4] -> [0, 5]*", function () {
        expectMove(OK, WHITE_TURN_INDEX, crownedScenario4, { row: 2, col: 3 }, { row: 0, col: 5 }, [
            ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'BM'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    /*
    * BLACK
      testState.board[1][0] = CONSTANTS.BLACK_MAN;
      testState.board[2][1] = CONSTANTS.WHITE_MAN;
      testState.board[4][3] = CONSTANTS.WHITE_MAN;
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 1:odd    ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 2:even   ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
    * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
    */
    var consecutiveJump = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[1, 0] -> [2, 1] -> [3, 2]", function () {
        expectMove(OK, BLACK_TURN_INDEX, consecutiveJump, { row: 1, col: 0 }, { row: 3, col: 2 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    it("[1, 0] -> [2, 1] -> [3, 2] is illegal to set turn to white", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, consecutiveJump, { row: 1, col: 0 }, { row: 3, col: 2 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    /*
      * TERMINATE TURN WHEN MOVES TO KINGS ROW - BLACK
        testState.board[6][1] = CONSTANTS.WHITE_MAN;
        testState.board[6][3] = CONSTANTS.WHITE_MAN;
        testState.board[5][0] = CONSTANTS.BLACK_MAN;
      *
      *             0     1     2     3     4     5     6     7
      * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
      * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
      * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
      * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
      * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
      * 5:odd   ['BM/K','--', 'DS', '--', 'DS', '--', 'DS', '--'],
      * 6:even   ['--', 'WM', '--', 'WM', '--', 'DS', '--', 'DS'],
      * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
      *
      * Note: BM/L means it will be assigned to BM or BK according to the
      *       specific test.
      */
    var terminateTurnAfterCrowning = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'WM', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[5, 0] -> [6, 1] -> [7, 2]*: Test for MAN", function () {
        expectMove(OK, BLACK_TURN_INDEX, terminateTurnAfterCrowning, { row: 5, col: 0 }, { row: 7, col: 2 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it("[5, 0] -> [6, 1] -> [7, 2]*: can't continue jumping", function () {
        expectMove(ILLEGAL, BLACK_TURN_INDEX, terminateTurnAfterCrowning, { row: 5, col: 0 }, { row: 7, col: 2 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    var terminateTurnAfterCrowningForKing = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['BK', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'WM', '--', 'WM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[5, 0] -> [6, 1] -> [7, 2]*: Test for KING (King can continue jump)", function () {
        expectMove(OK, BLACK_TURN_INDEX, terminateTurnAfterCrowningForKing, { row: 5, col: 0 }, { row: 7, col: 2 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--']
        ], BLACK_TURN_INDEX, NO_ONE_WINS);
    });
    /*
    * END GAME SCENARIO - BLACK
      match.stateBeforeMove.board[2][3] = CONSTANTS.BLACK_MAN;
      match.stateBeforeMove.board[3][2] = CONSTANTS.WHITE_MAN;
    *
    *             0     1     2     3     4     5     6     7
    * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 2:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
    * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
    * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
    * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
    * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
    */
    var endGameForBlack = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[2, 3] -> [3, 2] -> [4, 1]", function () {
        expectMove(OK, BLACK_TURN_INDEX, endGameForBlack, { row: 2, col: 3 }, { row: 4, col: 1 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], NO_ONE_TURN, BLACK_WIN_SCORES);
    });
    var endGameForBlack2 = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['BM', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
    ];
    it("[5, 0] -> [6, 1]: Legal because [7, 0] has no moves", function () {
        expectMove(OK, BLACK_TURN_INDEX, endGameForBlack2, { row: 5, col: 0 }, { row: 6, col: 1 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], NO_ONE_TURN, BLACK_WIN_SCORES);
    });
    it("[5, 2] -> [6, 3]: Legal but game continues", function () {
        expectMove(OK, BLACK_TURN_INDEX, endGameForBlack2, { row: 5, col: 2 }, { row: 6, col: 3 }, [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], WHITE_TURN_INDEX, NO_ONE_WINS);
    });
    it('Sample game', function () {
        // Sample game: http://en.wikipedia.org/wiki/English_draughts#Sample_game
        function idToDelta(id) {
            return { row: Math.floor(id / 8), col: id % 8 };
        }
        var moves = [
            [17, 26],
            [44, 35],
            [26, 44],
            [53, 35],
            [8, 17],
            [51, 44],
            [23, 30],
            [58, 51],
            [30, 37],
            [46, 28],
            [19, 37],
            [44, 30],
            [21, 39],
            [42, 33],
            [12, 21],
            [35, 28],
            [21, 35],
            [55, 46],
            [39, 53],
            [62, 44],
            [44, 26],
            [26, 8],
            [14, 21],
            [51, 44],
            [7, 14],
            [49, 42],
            [21, 28],
            [33, 24],
            [14, 21],
            [40, 33],
            [21, 30],
            [44, 35],
            [28, 37],
            [33, 26],
            [37, 46],
            [26, 19],
            [10, 28],
            [35, 21],
            [46, 55],
            [42, 33],
            [55, 62],
            [33, 26],
            [62, 55],
            [60, 53],
            [30, 37],
            [53, 46],
            [37, 44],
            [46, 39],
            [44, 51],
            [56, 49],
            [51, 58],
            [49, 40],
            [58, 51],
            [26, 17],
            [51, 44],
            [39, 30],
            [44, 35],
            [30, 23],
            [35, 26],
            [21, 14],
            [55, 46],
            [14, 7],
            [46, 37],
            [7, 14],
            [37, 30],
            [17, 10],
            [1, 19],
            [8, 1],
            [19, 28],
            [1, 10],
            [3, 17],
            [24, 10],
            [30, 21],
            [14, 7],
            [28, 35],
            [10, 1],
            [35, 42],
            [1, 10],
            [42, 51],
            [10, 1],
            [51, 58],
            [1, 10],
            [58, 51],
            [10, 1],
            [51, 42],
            [1, 10],
            [42, 35],
            [10, 1],
            [26, 17],
            [1, 8],
            [17, 10],
            [40, 33],
            [35, 42],
        ];
        /**
         * Expected Result
         *
         *      0    1    2    3    4    5    6    7
         *   | -- | -- | -- | -- | -- | BM | -- | WC |
         *   | WC | -- | BC | -- | -- | -- | -- | -- |
         *   | -- | -- | -- | -- | -- | BC | -- | WM |
         *   | -- | -- | -- | -- | -- | -- | -- | -- |
         *   | -- | WB | -- | -- | -- | -- | -- | -- |
         *   | -- | -- | BC | -- | -- | -- | -- | -- |
         *   | -- | -- | -- | -- | -- | -- | -- | -- |
         *   | -- | -- | -- | -- | -- | -- | -- | -- |
         */
        var expectedBoard = [
            ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'WK'],
            ['WK', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'BK', '--', 'WM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ];
        var board = null;
        var turn = BLACK_TURN_INDEX;
        var movesNum = moves.length;
        expect(movesNum).toBe(46 * 2 + 1); // Black 46th move ends the game.
        for (var _i = 0; _i < moves.length; _i++) {
            var move = moves[_i];
            var fromDelta = idToDelta(move[0]);
            var toDelta = idToDelta(move[1]);
            var m = gameLogic.createMove(board, [{ fromDelta: fromDelta, toDelta: toDelta }], turn);
            board = m.stateAfterMove.board;
            turn = m.turnIndexAfterMove;
        }
        expect(angular.equals(board, expectedBoard)).toBe(true);
        expect(turn).toBe(WHITE_TURN_INDEX);
    });
});
//# sourceMappingURL=gameLogic_test.js.map