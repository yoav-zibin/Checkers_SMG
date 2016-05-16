module aiService {

  let CONSTANTS = gameLogic.CONSTANTS;

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
  function getSquareValue(square: string, row: number, col: number): number {
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
  function getStateValue(board: Board, turnIndex: number): number {
    let stateValue: number = 0,
        winner: string,
    // For different position of the board, there's a different weight.
        boardWeight: number[][] = [
          [0, 4, 0, 4, 0, 4, 0, 4],
          [4, 0, 3, 0, 3, 0, 3, 0],
          [0, 3, 0, 2, 0, 2, 0, 4],
          [4, 0, 2, 0, 1, 0, 3, 0],
          [0, 3, 0, 1, 0, 2, 0, 4],
          [4, 0, 2, 0, 2, 0, 3, 0],
          [0, 3, 0, 3, 0, 3, 0, 4],
          [4, 0, 4, 0, 4, 0, 4, 0]
        ],
        cell: string,
        squareValue: number,
        row: number,
        col: number;

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
          } else {
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
  function getStateScoreForIndex0(move: IMove, turnIndex: number): number {
    // getStateValue return the score for player 1.
    return -getStateValue(move.stateAfterMove.board, turnIndex);
  }


  function addMegaJumpMoves(allPossibleMoves: MiniMove[][], board: Board, turnIndex: number, from: BoardDelta) {
    let possibleMoves = gameLogic.getJumpMoves(board, from, turnIndex);
    for (let possibleMove of possibleMoves) {
      let miniMove: MiniMove[] = [];
      let currentPos = from;
      let nextPos = possibleMove;
      let currentBoard = board;
      // Finishing the jump if there are still mandatory jumps.
      do {
        let iMove = gameLogic.createMiniMove(currentBoard, currentPos, nextPos, turnIndex);
        miniMove.push({fromDelta: currentPos, toDelta: nextPos});
        // If the turn changes, then there are no more mandatory jumps
        if (iMove.turnIndexAfterMove !== turnIndex) break;
        // We need to make another jump: update currentBoard, currentPos, nextPos
        currentBoard = iMove.stateAfterMove.board;
        currentPos = nextPos;
        nextPos = gameLogic.getJumpMoves(currentBoard, nextPos, turnIndex)[0]; // Just take the first possible jump move for that jumping piece
      } while (true);
      allPossibleMoves.push(miniMove);
    }
  }
  /**
   * Get all possible moves.
   */
  function getAllMoves(board: Board, turnIndex: number): MiniMove[][] {
    let allPossibleMoves: MiniMove[][] = [];

    let hasMandatoryJump =
        gameLogic.hasMandatoryJumps(board, turnIndex);

    // Check each square of the board
    for (let row = 0; row < CONSTANTS.ROW; row += 1) {
      for (let col = 0; col < CONSTANTS.COLUMN; col += 1) {
        if (gameLogic.isOwnColor(turnIndex,
                board[row][col].substr(0, 1))) {
          let delta = {row: row, col: col};
          if (hasMandatoryJump) {
            addMegaJumpMoves(allPossibleMoves, board, turnIndex, delta);
          } else {
            // If there's no mandatory jump,
            // then check the possible simple move
            let possibleMoves = gameLogic.getSimpleMoves(board, delta, turnIndex);
            for (let possibleMove of possibleMoves) {
              allPossibleMoves.push([{fromDelta: delta, toDelta: possibleMove}]);
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
  function getNextStates(move: IMove, playerIndex: number): IMove[] {
    let board: Board = move.stateAfterMove.board;
    let allPossibleMoveDeltas: MiniMove[][] = getAllMoves(board, playerIndex);
    let allPossibleMoves: IMove[] = [];

    for (let i = 0; i < allPossibleMoveDeltas.length; i++) {
      allPossibleMoves[i] = gameLogic.createMove(angular.copy(board),
          allPossibleMoveDeltas[i],
          playerIndex);
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
  export function createComputerMove(board: Board, playerIndex: number, alphaBetaLimits: IAlphaBetaLimits): IMove {
    return alphaBetaService.alphaBetaDecision(
        {stateAfterMove: {board: board ? board : gameLogic.getInitialBoard(), miniMoves: []}, 
          endMatchScores: null, turnIndexAfterMove: null},
        playerIndex, getNextStates, getStateScoreForIndex0,
        // If you want to see debugging output in the console, then pass
        // getDebugStateToString instead of null
        null,
        //getDebugStateToString,
        alphaBetaLimits);
  }

}