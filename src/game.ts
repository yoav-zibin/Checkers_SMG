interface CellSize {
  width: number;
  height: number;
}

interface TopLeft {
  top: number;
  left: number;
}

interface MoveDeltas {
  from: BoardDelta;
  to: BoardDelta;
}


module game {
  let animationEnded = false;
  let isComputerTurn = false;
  let canMakeMove: boolean = false;
  export let isHelpModalShown: boolean = false;

  var CONSTANTS: any = gameLogic.CONSTANTS;
  var gameArea: HTMLElement = null;

  // Global variables for drag-n-drop and ai move animations
  var dndStartPos: BoardDelta = null;
  var dndElem: HTMLElement = null;
  var aiMoveDeltas: MoveDeltas = null;


  let board: Board = null;
  let shouldRotateBoard: boolean = false;
  let turnIndex: number = null;



  /**
   * Send initial move
   */
  export function init() {
    console.log("Translation of 'RULES_OF_CHECKERS' is " + translate('RULES_OF_CHECKERS'));
    resizeGameAreaService.setWidthToHeight(1);
    /**
     * Set the game!
     */
    gameService.setGame({
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      isMoveOk: gameLogic.isMoveOk,
      updateUI: updateUI
    });

    // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
    document.addEventListener("animationend", animationEndedCallback, false); // standard
    document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
    document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
    dragAndDropService.addDragListener("gameArea", handleDragEvent);
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
      sendComputerMove();
    });
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    let move = aiService.createComputerMove(board, turnIndex, {millisecondsLimit: 1000});
    log.info("computer move: ", move);
    gameService.makeMove(move);
  }





  /**
   * This method update the game's UI.
   * @param params
   */
  function updateUI(params: IUpdateUI): void {

    //Rotate the board 180 degrees, hence in the point of current
    //player's view, the board always face towards him/her;
    if (params.playMode === "playBlack") {
      shouldRotateBoard = true;
    } else {
      shouldRotateBoard = false;
    }

    // Get the new state
    turnIndex = params.yourPlayerIndex;
    board = params.stateAfterMove.board;

    // // White player initialize the game if the board is empty.
    if (isUndefinedOrNull(board) && params.yourPlayerIndex === 0) {
      initial();
      return;
    }

    // It's your move. (For the current browser...)
    canMakeMove = params.turnIndexAfterMove >= 0 &&
        params.yourPlayerIndex === params.turnIndexAfterMove;
    //
    // // You're a human player
    let isPlayerMove: boolean = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId !== '';
    isComputerTurn = isPlayerMove;



    // You're an AI player
    let isAiMove: boolean = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';

    if (!isUndefinedOrNull(aiMoveDeltas)) {
      playAnimation(aiMoveDeltas.from, aiMoveDeltas.to, false, function () {
        aiMoveDeltas = null;
      });
    }

    // The game is properly initialized, let's make a move :)
    // But first update the graphics (isAiMove: true)
    if (isAiMove) {
      $timeout(aiMakeMove, 500);
    }
  }


  /**
   * Add animation class so the animation may be performed accordingly
   *
   * @param callback makeMove function which will be called after the
   *                 animation is completed.
   */
  function playAnimation(fromDelta: BoardDelta, toDelta: BoardDelta, addClass: boolean, cb: ()=> void) {
    var fromIdx = toIndex(fromDelta.row, fromDelta.col);
    var toIdx = toIndex(toDelta.row, toDelta.col);
    var elem = document.getElementById("img_" + fromDelta.row + "_" + fromDelta.col);

    // Add the corresponding animation class
    switch (toIdx - fromIdx) {
      case CONSTANTS.COLUMN + 1:
        // Simple move up left
        processAnimationClass(elem, addClass, 'move_down_right', 'move_up_left');
        break;
      case CONSTANTS.COLUMN - 1:
        // Simple move up right
        processAnimationClass(elem, addClass, 'move_down_left', 'move_up_right');
        break;
      case -CONSTANTS.COLUMN + 1:
        // Simple move down left
        processAnimationClass(elem, addClass, 'move_up_right', 'move_down_left');
        break;
      case -CONSTANTS.COLUMN - 1:
        // Simple move down right
        processAnimationClass(elem, addClass, 'move_up_left', 'move_down_right');
        break;
      case (2 * CONSTANTS.COLUMN) + 2:
        // Jump move up left
        processAnimationClass(elem, addClass, 'jump_down_right', 'jump_up_left');
        break;
      case (2 * CONSTANTS.COLUMN) - 2:
        // Jump move up right
        processAnimationClass(elem, addClass, 'jump_down_left', 'jump_up_right');
        break;
      case -(2 * CONSTANTS.COLUMN) + 2:
        // Jump move down left
        processAnimationClass(elem, addClass, 'jump_up_right', 'jump_down_left');
        break;
      case -(2 * CONSTANTS.COLUMN) - 2:
        // Jump move down right
        processAnimationClass(elem, addClass, 'jump_up_left', 'jump_down_right');
        break;
    }

    if (addClass) {
      elem.addEventListener("animationend", cb, false);
      elem.addEventListener("webkitAnimationEnd", cb, false);
    } else {
      //todo
      elem.removeEventListener("animationend", cb, false);
      elem.removeEventListener("webkitAnimationEnd", cb, false);
      cb();
    }
  }


  function processAnimationClass(elem: HTMLElement, addClass: boolean, normalClassName: string, rotatedClassName: string) {
    if (addClass) {
      if (shouldRotateBoard) {
        elem.className += ' ' + rotatedClassName;
      } else {
        elem.className += ' ' + normalClassName;
      }
    } else {
      elem.className = 'piece';
    }
  }

  /**
   * Make the move by using gameService.
   */
  function makeMove(fromDelta: BoardDelta, toDelta: BoardDelta): void {
    var operations: IMove;

    try {
      operations = gameLogic.createMove(angular.copy(board),
          fromDelta, toDelta, turnIndex);
    } catch (e) {
      return;
    }

    if (canMakeMove) {
      canMakeMove = false;
      gameService.makeMove(operations);
    }
  }

  /**
   * This function use the alpha beta pruning algorithm to calculate a
   * best move for the ai, then play the animation and after the animation
   * ends, make the move.
   */
  function aiMakeMove(): void {
    var bestMove: IMove,
        timeLimit = 1000;

    bestMove = aiService.createComputerMove(board, turnIndex,
        // 1 seconds for the AI to choose a move
        {millisecondsLimit: timeLimit});

    // Instead of making the move directly, use makeMove function instead.
    var from = bestMove[bestMove.length - 2];
    var to = bestMove[bestMove.length - 1];
    var fromDelta = {
      row: from.set.value.row,
      col: from.set.value.col
    };
    var toDelta = {
      row: to.set.value.row,
      col: to.set.value.col
    };

    aiMoveDeltas = {from: fromDelta, to: toDelta};

    playAnimation(fromDelta, toDelta, true, function () {
      // Make the move after playing the animaiton.
      makeMove(fromDelta, toDelta);
    });
  }

  /**
   * Send initial move
   */
  function initial() {
    try {
      var move = gameLogic.getFirstMove();
      gameService.makeMove(move);
    } catch (e) {
      log.info(e);
      log.info("initialGame() failed");
    }
  };

  /**
   * Convert the delta to UI state index
   */
  function toIndex(row: number, col: number) {
    return row * CONSTANTS.COLUMN + col;
  }


  function isUndefinedOrNull(val: any): boolean {
    return angular.isUndefined(val) || val === null;
  };

  /**
   * Check if it is a dark cell.
   */
  export function isDarkCell(row: number, col: number): boolean {
    var isEvenRow = row % 2 === 0;
    var isEvenCol = col % 2 === 0;

    return ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol));
  }

  /**
   * Rotate 180 degrees by simply convert the row and col number for UI.
   */
  function rotate(delta: BoardDelta): BoardDelta {
    if (shouldRotateBoard) {
      // Zero based
      return {
        row: CONSTANTS.ROW - delta.row - 1,
        col: CONSTANTS.COLUMN - delta.col - 1
      };
    }

    return delta;
  }

  /**
   * Check if there's a piece within the cell.
   */
  export function hasPiece(row: number, col: number): boolean {
    var delta: BoardDelta = {row: row, col: col};
    var rotatedDelta = rotate(delta);

    return isDarkCell(rotatedDelta.row, rotatedDelta.col) &&
        !isUndefinedOrNull( board) &&
        board[rotatedDelta.row][rotatedDelta.col] !== 'DS';
  }

  export function getPieceSrc(row: number, col: number): string {
    var delta: BoardDelta = {row: row, col: col};
    var rotatedDelta: BoardDelta = rotate(delta);
    var dir: string = 'imgs/';
    var ext: string = '.png';

    if (hasPiece(row, col)) {
      switch (board[rotatedDelta.row][rotatedDelta.col]) {
        case 'BM':
          return dir + 'black_man' + ext;
        case 'BK':
          return dir + 'black_cro' + ext;
        case 'WM':
          return dir + 'white_man' + ext;
        case 'WK':
          return dir + 'white_cro' + ext;
      }
    }

    return dir + 'empty' + ext;
  }

  function handleDragEvent(type: string, cx: number, cy: number) {
    gameArea = document.getElementById("gameArea");
    var cellSize: CellSize = getCellSize();

    // Make sure the player can not drag the piece outside of the board
    var x: number = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
    var y: number = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);

    var delta: BoardDelta = {
      row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
      col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
    };
    var rotatedDelta: BoardDelta = rotate(delta);

    if (type === "touchstart" && canDrag(delta.row, delta.col) && isUndefinedOrNull(dndStartPos)) {
      // Start to drag a piece
      dndStartPos = angular.copy(delta);

      // If a piece is dragged, store the piece element
      if (hasPiece(delta.row, delta.col) &&
          canMakeMove &&
          isOwnColor(rotatedDelta)) {
        dndElem = document.getElementById("img_" + dndStartPos.row + "_" + dndStartPos.col);
      }
    } else if (type === "touchend" && !isUndefinedOrNull(dndStartPos)) {
      // Drop a piece
      var from = {row: dndStartPos.row, col: dndStartPos.col};
      var to = {row: delta.row, col: delta.col};

      makeMove(rotate(from), rotate(to));

      setDndElemPos(getCellPos(dndStartPos.row, dndStartPos.col));

      dndStartPos = null;
      if (!isUndefinedOrNull(dndElem)) {
        dndElem.removeAttribute("style");
        dndElem = null;
      }
    } else if (type === 'touchmove' && !isUndefinedOrNull(dndStartPos)) {
      // Dragging around
      setDndElemPos({
        top: y - cellSize.height * 0.605,
        left: x - cellSize.width * 0.605
      });
    }

    // Clean up
    if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
      dndStartPos = null;
      dndElem = null;
    }
  }


  /**
   * Check if the piece in the delta position has the own color.
   */
  function isOwnColor(delta: BoardDelta): boolean {
    return gameLogic.isOwnColor(turnIndex, board[delta.row][delta.col].substring(0, 1));
  }


  /**
   * Check if the piece can be dragged.
   */
  function canDrag(row: number, col: number): boolean {
    var delta: BoardDelta = {row: row, col: col};
    var rotatedDelta: BoardDelta = rotate(delta);

    if (!isDarkCell(row, col) || !gameLogic.isOwnColor(turnIndex, board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
      return false;
    }

    var hasMandatoryJump: boolean = gameLogic.hasMandatoryJumps(board, turnIndex);
    var possibleMoves: BoardDelta[];

    if (hasMandatoryJump) {
      possibleMoves = gameLogic
          .getJumpMoves(board, rotatedDelta, turnIndex);
    } else {
      possibleMoves = gameLogic
          .getSimpleMoves(board, rotatedDelta, turnIndex);
    }

    return possibleMoves.length > 0;
  }


  /**
   * Set the TopLeft of the element.
   */
  function setDndElemPos(pos: TopLeft): void {
    var size: CellSize = getCellSize();
    var top: number = size.height / 10;
    var left: number = size.width / 10;

    var originalSize = getCellPos(dndStartPos.row, dndStartPos.col);
    if (dndElem !== null) {
      dndElem.style.left = (pos.left - originalSize.left + left) + "px";
      dndElem.style.top = (pos.top - originalSize.top + top) + "px";
    }
  }

  /**
   * Get the position of the cell.
   */
  function getCellPos(row: number, col: number): TopLeft {
    var size: CellSize = getCellSize();
    let top: number = row * size.height;
    let left: number = col * size.width;
    let pos: TopLeft = {top: top, left: left};
    return pos;
  }

  /**
   * Get the size of the cell.
   */
  function getCellSize(): CellSize {
    return {
      width: gameArea.clientWidth / CONSTANTS.COLUMN,
      height: gameArea.clientHeight / CONSTANTS.ROW
    };
  }


}





angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    translate.setLanguage('en',  {
      "RULES_OF_CHECKERS":"Rules of Checkers",
      "RULES_SLIDE1":"Uncrowned pieces move one step diagonally forward and capture an opponent's piece by moving two consecutive steps in the same line, jumping over the piece on the first step. Multiple opposing pieces may be captured in a single turn provided this is done by successive jumps made by a single piece; the jumps do not need to be in the same line but may \"zigzag\" (change diagonal direction).",
      "RULES_SLIDE2":"When a man reaches the kings row (the farthest row forward), it becomes a king, and acquires additional powers including the ability to move backwards (and capture backwards). As with non-king men, a king may make successive jumps in a single turn provided that each jump captures an opponent man or king.",
      "RULES_SLIDE3":"Capturing is mandatory.",
      "RULES_SLIDE4":"The player without pieces remaining, or who cannot move due to being blocked, loses the game.",
      "CLOSE":"Close"
    });
    game.init();
  });
