interface SupportedLanguages { en: string, zh: string};
interface Translations {
  [index: string]: SupportedLanguages;
}

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
  export let isHelpModalShown: boolean = false;

  let CONSTANTS: any = gameLogic.CONSTANTS;
  let gameArea: HTMLElement = null;
  
  // Global variables that are cleared on getting updateUI.
  // I'm exporting all these variables for easier debugging from the console.
  export let currUpdateUI: IUpdateUI = null;
  export let board: Board = null;
  export let shouldRotateBoard: boolean = false;
  export let isComputerTurn = false;
  export let didHumanMakeMove: boolean = false;
  export let remainingAnimations: MiniMove[] = [];
  export let animationInterval: ng.IPromise<any> = null;

  // for drag-n-drop and ai move animations
  export let dndStartPos: BoardDelta = null;
  export let dndElem: HTMLElement = null;

  function getTranslations(): Translations {
    return {
      "RULES_OF_CHECKERS": {
        en: "Rules of Checkers",
        zh: "英国跳棋规则",
      },
      "RULES_SLIDE1": {
        en: "Uncrowned pieces move one step diagonally forward and capture an opponent's piece by moving two consecutive steps in the same line, jumping over the piece on the first step. Multiple opposing pieces may be captured in a single turn provided this is done by successive jumps made by a single piece; the jumps do not need to be in the same line but may \"zigzag\" (change diagonal direction).",
        zh: "\"未成王\"的棋子只能斜着走向前方临近的空格子。吃子时，敌方的棋子必须是在前方斜方向临近的格子里，而且该敌方棋子的对应的斜方格子里必须没有棋子。只要斜前方还有可以吃的子，便可以多次吃子。",
      },
      "RULES_SLIDE2": {
        en: "When a man reaches the kings row (the farthest row forward), it becomes a king, and acquires additional powers including the ability to move backwards (and capture backwards). As with non-king men, a king may make successive jumps in a single turn provided that each jump captures an opponent man or king.",
        zh: "当棋子到底线停下时，它就\"成王\"，以后便可以向后移动，同时多次吃子是也可以向后吃子。",
      },
      
      "RULES_SLIDE3": {
        en: "Capturing is mandatory.",
        zh: "若一枚棋子可以吃棋，它必须吃。棋子可以连吃。即是说，若一枚棋子吃过敌方的棋子后，若它新的位置亦可以吃敌方的另一些敌方棋子，它必须再吃，直到无法再吃为止。",
      },
      "RULES_SLIDE4":{
        en: "The player without pieces remaining, or who cannot move due to being blocked, loses the game.",
        zh: "若一位玩家没法行走或所有棋子均被吃去便算输。",
      },
      "CLOSE":{
        en: "Close",
        zh: "继续游戏",
      },
    };
  }
  
  /**
   * Send initial move
   */
  export function init() {
    translate.setTranslations(getTranslations());
    translate.setLanguage('en');
    
    console.log("Translation of 'RULES_OF_CHECKERS' is " + translate('RULES_OF_CHECKERS'));
    resizeGameAreaService.setWidthToHeight(1);
    /**
     * Set the game!
     */
    moveService.setGame({
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      checkMoveOk: gameLogic.checkMoveOk,
      updateUI: updateUI
    });

    let w: any = window;
    if (w["HTMLInspector"]) {
      setInterval(function () {
        w["HTMLInspector"].inspect({
          excludeRules: ["unused-classes", "script-placement"],
        });
      }, 3000);
    }
    
    dragAndDropService.addDragListener("gameArea", handleDragEvent);
  }

  function clearAnimationInterval() {
    if (animationInterval) {
      $interval.cancel(animationInterval);
      animationInterval = null;
    }
  }
  
  function advanceToNextAnimation() {
    if (remainingAnimations.length == 0) return;
    
    let miniMove = remainingAnimations.shift();
    let iMove = gameLogic.createMiniMove(board, miniMove.fromDelta, miniMove.toDelta, currUpdateUI.turnIndexBeforeMove);
    board = iMove.stateAfterMove.board;
    if (remainingAnimations.length == 0) {
      clearAnimationInterval();
      // Checking we got to the corrent board
      let expectedBoard = currUpdateUI.move.stateAfterMove.board;
      if (!angular.equals(board, expectedBoard)) {
        throw new Error("Animations ended in a different board: expected=" + angular.toJson(expectedBoard, true) + " actual after animations=" + angular.toJson(board, true));
      }
      sendComputerMove();
    }
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    let move = aiService.createComputerMove(board, yourPlayerIndex(), {millisecondsLimit: 1000});
    log.info("computer move: ", move);
    moveService.makeMove(move);
  }

  /**
   * This method update the game's UI.
   * @param params
   */
  // for drag-n-drop and ai move animations
  function updateUI(params: IUpdateUI): void {
    currUpdateUI = params;
    clearDragNDrop();

    //Rotate the board 180 degrees, hence in the point of current
    //player's view, the board always face towards him/her;
    shouldRotateBoard = params.playMode === 1;

    let move = params.move;
    let isFirstMove = !move.stateAfterMove;
    
    // Handle animations
    clearAnimationInterval();
    if (isFirstMove) {
      board = gameLogic.getInitialBoard();  
      remainingAnimations = [];
    } else {
      board = params.stateBeforeMove ? params.stateBeforeMove.board : gameLogic.getInitialBoard();
      remainingAnimations = angular.copy(move.stateAfterMove.miniMoves);  
      animationInterval = $interval(advanceToNextAnimation, 500);
    }
    
    didHumanMakeMove = false; 
    isComputerTurn = isMyTurn() &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    // We calculate the AI move only after the animation finishes,
    // because if we call aiService now
    // then the animation will be paused until the javascript finishes.
    if (isComputerTurn && isFirstMove) {
      // This is the first move in the match, so
      // there is not going to be an animation, so
      // call sendComputerMove() now (can happen in ?onlyAIs mode)
      sendComputerMove();
    }
  }
  
  function yourPlayerIndex() {
    return currUpdateUI ? currUpdateUI.yourPlayerIndex : -1;
  }
  
  function isMyTurn() {
    return currUpdateUI &&
      currUpdateUI.move.turnIndexAfterMove >= 0 && // game is ongoing
      currUpdateUI.yourPlayerIndex === currUpdateUI.move.turnIndexAfterMove; // it's my turn
  }
  
  function canHumanMakeMove() {
    return isMyTurn() && 
      currUpdateUI.playersInfo[currUpdateUI.yourPlayerIndex].playerId !== '' && // I'm NOT a computer
      remainingAnimations.length == 0 && // you can only move after all animations are over.
      !didHumanMakeMove; // you can only make one move per updateUI.
  }

  function getAnimationClassFromIdDiff(idDiff: number) {
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
  
  export function getAnimationClass(row: number, col: number) {
    if (remainingAnimations.length == 0) return ""; // No animations to show.
    
    let fromDelta =  remainingAnimations[0].fromDelta;
    let toDelta =  remainingAnimations[0].toDelta;
    let middleDelta = {row: (fromDelta.row + toDelta.row) / 2, col: (fromDelta.col + toDelta.col) / 2};
    
    let rotatedDelta = rotate({row: row, col: col});
    if (fromDelta.row === rotatedDelta.row && fromDelta.col === rotatedDelta.col) {
      let fromIdx = toIndex(fromDelta.row, fromDelta.col);
      let toIdx = toIndex(toDelta.row, toDelta.col);
      let idDiff = fromIdx - toIdx;
      return getAnimationClassFromIdDiff(shouldRotateBoard ? -idDiff : idDiff);
    } else if (middleDelta.row === rotatedDelta.row && middleDelta.col === rotatedDelta.col) {
      // It's a jump move and this piece is being eaten.
      return "explodePiece";
    } else {
      return "";
    }
  }

  function makeMiniMove(fromDelta: BoardDelta, toDelta: BoardDelta): void {
    log.info("makeMiniMove from:", fromDelta, " to: ", toDelta);
    if (!canHumanMakeMove()) {
      return;
    }
    let nextMove: IMove = null;
    try {
      nextMove = gameLogic.createMove(angular.copy(board),
          [{fromDelta: fromDelta, toDelta: toDelta}], yourPlayerIndex());
    } catch (e) {
      log.info(["Move is illegal:", e]);
      return;
    }

    // Move is legal, make it!
    didHumanMakeMove = true; // to prevent making another move
    moveService.makeMove(nextMove);
  }

  /**
   * Convert the delta to UI state index
   */
  function toIndex(row: number, col: number) {
    return row * CONSTANTS.COLUMN + col;
  }

  /**
   * Check if it is a dark cell.
   */
  export function isDarkCell(row: number, col: number): boolean {
    let isEvenRow = row % 2 === 0;
    let isEvenCol = col % 2 === 0;

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
    let rotatedDelta = rotate({row: row, col: col});

    return isDarkCell(rotatedDelta.row, rotatedDelta.col) &&
        board &&
        board[rotatedDelta.row][rotatedDelta.col] !== 'DS';
  }

  export function getPieceSrc(row: number, col: number): string {
    let rotatedDelta = rotate({row: row, col: col});
    let dir: string = 'imgs/';
    let ext: string = '.png';

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

    return '';
  }
  
  function clearDragNDrop() {
    dndStartPos = null;
    if (dndElem) dndElem.removeAttribute("style");
    dndElem = null;
  }

  function handleDragEvent(type: string, cx: number, cy: number) {
    gameArea = document.getElementById("gameArea");
    let cellSize: CellSize = getCellSize();

    // Make sure the player can not drag the piece outside of the board
    let x: number = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
    let y: number = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);

    let delta: BoardDelta = {
      row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
      col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
    };
    let rotatedDelta: BoardDelta = rotate(delta);

    if (type === "touchstart" && canDrag(delta.row, delta.col)) {
      // If a piece is dragged, store the piece element
      if (hasPiece(delta.row, delta.col) &&
          canHumanMakeMove() &&
          isOwnColor(rotatedDelta)) {
        dndStartPos = angular.copy(delta);
        dndElem = document.getElementById("img_" + dndStartPos.row + "_" + dndStartPos.col);
      }
    } else if (type === "touchend" && dndStartPos) {
      // Drop a piece
      let from = {row: dndStartPos.row, col: dndStartPos.col};
      let to = {row: delta.row, col: delta.col};

      makeMiniMove(rotate(from), rotate(to));

      setDndElemPos(getCellPos(dndStartPos.row, dndStartPos.col));
      clearDragNDrop();
      
    } else if (type === 'touchmove' && dndStartPos) {
      // Dragging around
      setDndElemPos({
        top: y - cellSize.height * 0.605,
        left: x - cellSize.width * 0.605
      });
    }

    // Clean up
    if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
      clearDragNDrop();
    }
  }


  /**
   * Check if the piece in the delta position has the own color.
   */
  function isOwnColor(delta: BoardDelta): boolean {
    return gameLogic.isOwnColor(yourPlayerIndex(), board[delta.row][delta.col].substring(0, 1));
  }


  /**
   * Check if the piece can be dragged.
   */
  function canDrag(row: number, col: number): boolean {
    let delta: BoardDelta = {row: row, col: col};
    let rotatedDelta: BoardDelta = rotate(delta);

    if (!isDarkCell(row, col) || !gameLogic.isOwnColor(yourPlayerIndex(), board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
      return false;
    }

    let hasMandatoryJump: boolean = gameLogic.hasMandatoryJumps(board, yourPlayerIndex());
    let possibleMoves: BoardDelta[];

    if (hasMandatoryJump) {
      possibleMoves = gameLogic
          .getJumpMoves(board, rotatedDelta, yourPlayerIndex());
    } else {
      possibleMoves = gameLogic
          .getSimpleMoves(board, rotatedDelta, yourPlayerIndex());
    }

    return possibleMoves.length > 0;
  }


  /**
   * Set the TopLeft of the element.
   */
  function setDndElemPos(pos: TopLeft): void {
    let size: CellSize = getCellSize();
    let top: number = size.height / 10;
    let left: number = size.width / 10;

    let originalSize = getCellPos(dndStartPos.row, dndStartPos.col);
    if (dndElem !== null) {
      dndElem.style.left = (pos.left - originalSize.left + left) + "px";
      dndElem.style.top = (pos.top - originalSize.top + top) + "px";
    }
  }

  /**
   * Get the position of the cell.
   */
  function getCellPos(row: number, col: number): TopLeft {
    let size: CellSize = getCellSize();
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

  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isHelpModalShown = false;
    }
    return true;
  }
}

angular.module('myApp', [ 'ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });
