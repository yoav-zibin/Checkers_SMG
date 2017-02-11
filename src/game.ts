interface SupportedLanguages {
  en: string, iw: string,
  pt: string, zh: string,
  el: string, fr: string,
  hi: string, es: string,
};

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
  export let $rootScope: angular.IScope = null;
  export let $interval: angular.IIntervalService = null;

  let CONSTANTS: any = gameLogic.CONSTANTS;
  let gameArea: HTMLElement = null;

  // Global variables are cleared when getting updateUI.
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console, e.g.,
  // game.currentUpdateUI
  export let currentUpdateUI: IUpdateUI = null;
  export let board: Board = null;
  export let shouldRotateBoard: boolean = false;
  export let didMakeMove: boolean = false; // You can only make one move per updateUI
  export let humanMiniMoves: MiniMove[] = []; // We collect all the mini-moves into one mega-move.
  export let lastHumanMove: IMove = null; // We don't animate moves we just made.
  export let remainingAnimations: MiniMove[] = [];
  export let animationInterval: ng.IPromise<any> = null;
  // for drag-n-drop and ai move animations
  export let dndStartPos: BoardDelta = null;
  export let dndElem: HTMLElement = null;
  // If any of the images has a loading error, we're probably offline, so we turn off the avatar customization.
  export let hadLoadingError = false;

  // For community games.
  export let proposals: number[][] = null;
  export let yourPlayerInfo: IPlayerInfo = null;

  function getTranslations(): Translations {
    return {};
  }

  export function getStateForOgImage() {
    if (!currentUpdateUI) {
      log.warn("Got stateForOgImage without currentUpdateUI!");
      return;
    }
    let state: IState = currentUpdateUI.state;
    if (!state) return '';
    let board: string[][] = state.board;
    let boardStr: string = '';
    for (let row = 0 ; row < 8; row++) {
      for (let col = 0 ; col < 8; col++) {
        // First row in state is top row, so I need to reverse rows.
        // Also, rotating the board if I'm index=1.
        let cell = currentUpdateUI.yourPlayerIndex == 1 ? board[row][7 - col] : board[7 - row][col];
        if (cell == "--" || cell == "DS") {
          boardStr += "x";
        } else {
          // switching white&black
          let color = cell.substr(0, 1);
          let kind = cell.substr(1, 1);
          boardStr += (color == "W" ? "B" : "W") + kind;
        }
      }
    }
    return boardStr;
  } 

  export function init($rootScope_: angular.IScope, $interval_: angular.IIntervalService) {
    $rootScope = $rootScope_;
    $interval = $interval_;
    log.alwaysLog("Checkers version 1.3");
    registerServiceWorker();
    gameArea = document.getElementById("gameArea");
    if (!gameArea) throw new Error("Can't find gameArea div!");

    translate.setTranslations(getTranslations());
    translate.setLanguage('en');

    resizeGameAreaService.setWidthToHeight(1);
    gameService.setGame({
      updateUI: updateUI,
      getStateForOgImage: getStateForOgImage,
    });

    dragAndDropService.addDragListener("gameArea", handleDragEvent);
  }

  function registerServiceWorker() {
    // I prefer to use appCache over serviceWorker
    // (because iOS doesn't support serviceWorker, so we have to use appCache)
    // I've added this code for a future where all browsers support serviceWorker (so we can deprecate appCache!)
    if (!window.applicationCache && 'serviceWorker' in navigator) {
      let n: any = navigator;
      log.log('Calling serviceWorker.register');
      n.serviceWorker.register('service-worker.js').then(function(registration: any) {
        log.log('ServiceWorker registration successful with scope: ',    registration.scope);
      }).catch(function(err: any) {
        log.log('ServiceWorker registration failed: ', err);
      });
    }
  }

  function setAnimationInterval() {
    animationInterval = $interval(advanceToNextAnimation, 700);
  }
  function clearAnimationInterval() {
    if (animationInterval) {
      $interval.cancel(animationInterval);
      animationInterval = null;
    }
  }

  function advanceToNextAnimation() {
    if (remainingAnimations.length == 0) {
      // The computer makes a move one tick (0.6sec) after the animations finished, to avoid stress on the UI thread.
      clearAnimationInterval();
      maybeSendComputerMove();
      updateCache();
      return;
    }
    let miniMove = remainingAnimations.shift();
    let iMove = gameLogic.createMiniMove(board, miniMove.fromDelta, miniMove.toDelta, 1 - currentUpdateUI.turnIndex);
    board = iMove.state.board;
    if (remainingAnimations.length == 0) {
      // Checking we got to the final correct board
      let expectedBoard = currentUpdateUI.state.board;
      if (!angular.equals(board, expectedBoard)) {
        throw new Error("Animations ended in a different board: expected=" + angular.toJson(expectedBoard, true) + " actual after animations=" + angular.toJson(board, true));
      }
    }
    updateCache();
  }

  export function getProposal(row: number, col: number) {
    if (remainingAnimations.length > 0) return 0; // only show proposals after all animations.
    let rotatedDelta = rotate({row: row, col: col});
    return proposals && proposals[rotatedDelta.row][rotatedDelta.col];
  }

  function updateProposals(playerIdToProposal: IProposals) {
    didMakeMove = !!playerIdToProposal[yourPlayerInfo.playerId];
    proposals = [];
    for (let i = 0; i < 8; i++) {
      proposals[i] = [];
      for (let j = 0; j < 8; j++) {
        proposals[i][j] = 0;
      }
    }
    for (let playerId in playerIdToProposal) {
      let proposal = playerIdToProposal[playerId];
      let miniMoves = proposal.data;
      let lastMiniMove = miniMoves[miniMoves.length-1].toDelta; 
      proposals[lastMiniMove.row][lastMiniMove.col]++;
    }
    updateCache();
  }

  export function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    didMakeMove = false; // Only one move per updateUI
    yourPlayerInfo = params.yourPlayerInfo;
    let playerIdToProposal = params.playerIdToProposal;
    proposals = null;
    if (playerIdToProposal) {
      updateProposals(playerIdToProposal);
      // If only proposals changed, then return.
      // I don't want to disrupt the player if he's in the middle of a move.
      params.playerIdToProposal = null;
      if (currentUpdateUI && angular.equals(currentUpdateUI, params)) return;
    }

    currentUpdateUI = params;
    hadLoadingError = false; // Retrying to load avatars every updateUI (maybe we're online again...)
    clearDragNDrop();
    humanMiniMoves = [];
    // We show animations if it's a non-human move or a move made by our opponents.
    // The move in multiplayer game have slightly different endMatchScores:
    // "endMatchScores":null  vs completley missing endMatchScores.
    // It's enought to check stateAfterMove anyway.
    let shouldAnimate = !lastHumanMove || !angular.equals(params.state, lastHumanMove.state);
    // lastHumanMove = null; On purpose not nullifying it because the platform may send the same updateUI again.

    //Rotate the board 180 degrees, hence in the point of current
    //player's view, the board always face towards him/her;
    shouldRotateBoard = params.playMode === 1;

    clearAnimationInterval();
    remainingAnimations = [];
    if (isFirstMove()) {
      board = gameLogic.getInitialBoard();
    } else if (!shouldAnimate || !params.state.boardBeforeMove) {
      board = params.state.board;
    } else {
      board = params.state.boardBeforeMove;
      // We calculate the AI move only after the animation finishes,
      // because if we call aiService now
      // then the animation will be paused until the javascript finishes.
      remainingAnimations = angular.copy(params.state.miniMoves);
    }
    setAnimationInterval(); // I want to make the AI move in 0.6 seconds (to not pause the UI thread for too long)
    updateCache();
  }

  function maybeSendComputerMove() {
    if (!isComputerTurn()) return;
    let move = aiService.createComputerMove(board, yourPlayerIndex(), {millisecondsLimit: 500});
    log.info("Computer move: ", move);
    makeMove(move);
  }

  function makeMove(move: IMove) {
    if (didMakeMove) { // Only one move per updateUI
      return;
    }
    didMakeMove = true;

    if (!proposals) {
      gameService.makeMove(move, null);
    } else {
      let miniMoves = move.state.miniMoves;
      let lastMiniMove = miniMoves[miniMoves.length-1].toDelta;

      let myProposal:IProposal = {
        data: miniMoves,
        chatDescription: '' + (lastMiniMove.row + 1) + 'x' + (lastMiniMove.col + 1),
        playerInfo: yourPlayerInfo,
      };
      // Decide whether we make a move or not.
      if (proposals[lastMiniMove.row][lastMiniMove.col] < currentUpdateUI.numberOfPlayersRequiredToMove - 1) {
        move = null;
      }
      gameService.makeMove(move, myProposal);
    }
  }

  function isFirstMove() {
    return !currentUpdateUI.state;
  }

  function yourPlayerIndex() {
    return currentUpdateUI.yourPlayerIndex;
  }

  function isComputer() {
    let playerInfo = currentUpdateUI.playersInfo[currentUpdateUI.yourPlayerIndex];
    return playerInfo && playerInfo.playerId === '';
  }

  function isComputerTurn() {
    return isMyTurn() && isComputer();
  }

  function isHumanTurn() {
    return isMyTurn() && !isComputer() &&
      remainingAnimations.length == 0; // you can only move after all animations are over.
  }

  function isMyTurn() {
    return !didMakeMove && // you can only make one move per updateUI.
      currentUpdateUI.turnIndex >= 0 && // game is ongoing
      currentUpdateUI.yourPlayerIndex === currentUpdateUI.turnIndex; // it's my turn
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
    if (!isHumanTurn()) {
      return;
    }
    // We collect minimoves and make a mega one.
    let miniMove: MiniMove = {fromDelta: fromDelta, toDelta: toDelta};
    let nextMove: IMove = null;
    try {
      nextMove = gameLogic.createMove(board,
          [miniMove], yourPlayerIndex());
    } catch (e) {
      log.info(["Move is illegal:", e]);
      return;
    }
    // Move is legal, make it!
    $rootScope.$apply(()=>{
      board = nextMove.state.board;
      humanMiniMoves.push(miniMove);
      // We finished our mega-move if it's now someone elses turn or game ended.
      if (nextMove.turnIndex !== currentUpdateUI.turnIndex) {
        let stateAfterMove = currentUpdateUI.state;
        lastHumanMove = nextMove = gameLogic.createMove(
            stateAfterMove ? stateAfterMove.board : gameLogic.getInitialBoard(),
            humanMiniMoves, yourPlayerIndex());
        makeMove(lastHumanMove);
      }
    });
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
    return (row + col) % 2 == 1;
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

  function getPiece(row: number, col: number): string {
    let rotatedDelta = rotate({row: row, col: col});
    return board[rotatedDelta.row][rotatedDelta.col];
  }

  /*
  TLDR: iOS has CORS problems with FB avatars, so I can only load FB images using a proxy.

  // On iOS and Safari, when loading:
  //  https://graph.facebook.com/10152824135331125/picture
  // it fails with "status":0, I see this errror in safari:
  // Failed to load resource: Request header field Accept-Encoding is not allowed by Access-Control-Allow-Headers.
  Nothing works...
  Finally found the issue, and there is nothing I can do about it:
  Safari doesn't set CORS on a redirect correctly:
  https://stackoverflow.com/questions/32332919/safari-fails-cors-request-after-302-redirect
  https://bugs.webkit.org/show_bug.cgi?id=98838
  I tried removing the headers: Accept, Accept-Encoding, Content-Type
  headers: {
    'Accept': undefined,
    'Accept-Encoding': undefined,
    'Content-Type': undefined
  },
  I tried directly using XMLHttpRequest, ... */
  let userAgent = navigator.userAgent.toLowerCase();
  let is_ios = userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipod") > -1 || userAgent.indexOf("ipad") > -1;
  function isFbAvatar(imgUrl: string): boolean {
    return imgUrl.indexOf("graph.facebook.com") > 0;
  }
  let isHttps = location.protocol === "https:";
  function replaceProtocol(url: string) {
    return isHttps ? replaceToHttps(url) : replaceToHttp(url);
  }
  function replaceToHttps(url: string) {
    return replacePrefix(url, "http:", "https:");
  }
  function replaceToHttp(url: string) {
    return replacePrefix(url, "https:", "http:");
  }
  function replacePrefix(url: string, from: string, to: string) {
    return url.indexOf(from) === 0 ? to + url.substr(from.length) : url;
  }
  function getMaybeProxiedImgUrl(imgUrl: string) {
    // E.g.,
    // http://multiplayer-gaming.appspot.com/proxy/?fwdurl=http://graph.facebook.com/10153589934097337/picture?height=300&width=300
    return is_ios && isFbAvatar(imgUrl) ? '//multiplayer-gaming.appspot.com/proxy/?fwdurl=' +
        encodeURIComponent(replaceToHttp(imgUrl)) :
        replaceProtocol(imgUrl);
  }

  export function onImgError() {
    if (hadLoadingError) return;
    log.info("had load img error");
    hadLoadingError = true;
    updateCacheAndApply();
  }

  function updateCacheAndApply() {
    updateCache();
    $rootScope.$apply();
  }

  function isLocalTesting() { return location.protocol === "file:"; }
  function hasAvatarImgUrl(avatarImageUrl: string) {
    return avatarImageUrl && avatarImageUrl.indexOf('imgs/autoMatchAvatar.png') === -1;
  }

  export function getBoardAvatar(playerIndex: number) {
    if (hadLoadingError) return '';
    // For local testing
    if (isLocalTesting()) return "http://graph.facebook.com/" +
        (playerIndex == 1 ? "10153589934097337" : "10153693068502449") + "/picture?height=200&width=400";
    if (shouldRotateBoard) playerIndex = 1 - playerIndex;
    let myPlayerInfo = currentUpdateUI.playersInfo[playerIndex];
    if (!myPlayerInfo) return '';
    let myAvatar = myPlayerInfo.avatarImageUrl;
    if (!hasAvatarImgUrl(myAvatar)) return '';
    // I only do it for FB users
    let myFbUserId = getFbUserId(myAvatar);
    return getMaybeProxiedImgUrl("http://graph.facebook.com/" + myFbUserId + "/picture?height=200&width=400");
  }

  function getFbUserId(avatarImageUrl: string) {
    let match = avatarImageUrl.match(/graph[.]facebook[.]com[/](\w+)[/]/);
    if (!match) return '';
    return match[1];
  }

  export function getBoardClass() {
    return hadLoadingError ? '' : 'transparent_board';
  }

  export function getPieceContainerClass(row: number, col: number) {
    return getAnimationClass(row, col);
  }

  export function getSquareClass(row: number, col: number) {
    if (!dndStartPos) {
      if (!canDrag({row: row, col: col})) return '';
      return 'can_drag_from_square';
    }
    // Dragging now, let's find if you can drop there.
    let fromDelta = rotate({row: dndStartPos.row, col: dndStartPos.col});
    let toDelta = rotate({row: row, col: col});
    if (!isHumanTurn()) {
      return '';
    }
    let miniMove: MiniMove = {fromDelta: fromDelta, toDelta: toDelta};
    try {
      gameLogic.createMove(board,
          [miniMove], yourPlayerIndex());
      return 'can_drop_on_square';
    } catch (e) {
    }
    return '';
  }

  export function getCellStyle(row: number, col: number) {
    let count = getProposal(row, col);
    if (!count) return;
    // proposals[row][col] is > 0
    let countZeroBased = count - 1;
    let maxCount = currentUpdateUI.numberOfPlayersRequiredToMove - 2;
    let ratio = maxCount == 0 ? 1 : countZeroBased / maxCount; // a number between 0 and 1 (inclusive).
    // scale will be between 0.6 and 0.8.
    let scale = 0.6 + 0.2 * ratio;
    // opacity between 0.5 and 0.7
    let opacity = 0.5 + 0.2 * ratio;
    return {
      transform: `scale(${scale}, ${scale})`,
      opacity: "" + opacity,
    };
  }

  export function getPieceClass(row: number, col: number) {
    let pieceSrc = cachedPieceSrc[row][col];
    if (!isAvatarPiece(pieceSrc)) {
      return 'piece';
    }
    let piece = getPiece(row, col);
    let pieceColor = gameLogic.getColor(piece);
    // Black&white are reversed in the UI because black should start.
    return pieceColor === CONSTANTS.BLACK ? 'piece avatar_piece lighter_avatar_piece' : 'piece avatar_piece darker_avatar_piece';
  }

  export function getAvatarPieceCrown(row: number, col: number) {
    let pieceSrc = cachedPieceSrc[row][col];
    if (!isAvatarPiece(pieceSrc)) return '';
    let piece = getPiece(row, col);
    let pieceKind = gameLogic.getKind(piece);
    if (pieceKind !== CONSTANTS.KING) return '';
    let pieceColor = gameLogic.getColor(piece);
    return pieceColor === CONSTANTS.BLACK ?
        "imgs/avatar_white_crown.svg" : "imgs/avatar_black_crown.svg";
  }

  function isAvatarPiece(img: string) {
    return img && img != bm_img && img != bk_img && img != wm_img && img != wk_img;
  }

  let dir: string = 'imgs/';
  let ext: string = '.png';
  let bm_img = dir + 'black_man' + ext;
  let bk_img = dir + 'black_cro' + ext;
  let wm_img = dir + 'white_man' + ext;
  let wk_img = dir + 'white_cro' + ext;
  export function getPieceSrc(row: number, col: number): string {
    let piece = getPiece(row, col);
    if (piece == 'DS' && getProposal(row, col) > 0) piece = currentUpdateUI.turnIndex == 0 ? 'WM' : 'BM';
    if (piece == '--' || piece == 'DS') {
      return '';
    }

    let pieceColor = gameLogic.getColor(piece);
    let pieceColorIndex = pieceColor === CONSTANTS.BLACK ? 1 : 0;
    let myPlayerInfo = currentUpdateUI.playersInfo[pieceColorIndex];
    if (myPlayerInfo && !hadLoadingError) {
      // Maybe use FB avatars
      let avatarImageUrl = myPlayerInfo.avatarImageUrl;
      let avatarPieceSrc = hasAvatarImgUrl(avatarImageUrl) ? getMaybeProxiedImgUrl(avatarImageUrl) :
        !isLocalTesting() ? '' :
        pieceColorIndex == 1 ? "http://graph.facebook.com/10153589934097337/picture" : "http://graph.facebook.com/10153693068502449/picture";
      if (avatarPieceSrc) return avatarPieceSrc;
    }
    switch (piece) {
      case 'BM':
        return bm_img;
      case 'BK':
        return bk_img;
      case 'WM':
        return wm_img;
      case 'WK':
        return wk_img;
    }
    return '';
  }

  function clearDragNDrop() {
    dndStartPos = null;
    if (dndElem) dndElem.removeAttribute("style");
    dndElem = null;
  }

  function handleDragEvent(type: string, cx: number, cy: number) {
    let cellSize: CellSize = getCellSize();

    // Make sure the player can not drag the piece outside of the board
    let x: number = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
    let y: number = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);
    let dndPos = {
        top: y - cellSize.height * 0.605,
        left: x - cellSize.width * 0.605
      };

    if (type === 'touchmove') {
      // Dragging around
      if (dndStartPos) setDndElemPos(dndPos, cellSize);
      return;
    }

    let delta: BoardDelta = {
      row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
      col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
    };

    if (type === "touchstart") {
      // If a piece is dragged, store the piece element
      if (canDrag(delta)) {
        dndStartPos = delta;
        dndElem = document.getElementById("img_container_" + dndStartPos.row + "_" + dndStartPos.col);
        let style: any = dndElem.style;
        style['z-index'] = 20;
        // Slightly bigger shadow (as if it's closer to you).
        //.piece class used to have:
        // -webkit-filter: brightness(100%) drop-shadow(0.1rem 0.1rem 0.1rem black);
        // filter: brightness(100%) drop-shadow(0.1rem 0.1rem 0.1rem black);
        // but it's making animations&dragging very slow, even on iphone6.
        //let filter = "brightness(100%) drop-shadow(0.3rem 0.3rem 0.1rem black)";
        //style['filter'] = filter;
        //style['-webkit-filter'] = filter;
        setDndElemPos(dndPos, cellSize);
        updateCacheAndApply(); // To show the droppable squares, see .can_drop_on_square
      }
      return;
    }

    if (type === "touchend" && dndStartPos) {
      // Drop a piece
      let from = {row: dndStartPos.row, col: dndStartPos.col};
      let to = {row: delta.row, col: delta.col};

      makeMiniMove(rotate(from), rotate(to));

      setDndElemPos(getCellPos(dndStartPos.row, dndStartPos.col, cellSize), cellSize);
      clearDragNDrop();
    }

    // Clean up
    if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
      clearDragNDrop();
      updateCacheAndApply(); // To show the draggable squares, see .can_drag_from_square
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
  function canDrag(delta: BoardDelta): boolean {
    let rotatedDelta: BoardDelta = rotate(delta);
    if (!isHumanTurn() || !isOwnColor(rotatedDelta)) return false;

    if (!gameLogic.isOwnColor(yourPlayerIndex(), board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
      return false;
    }

    // The same piece must make all the jumps!
    if (humanMiniMoves.length > 0 && !angular.equals(rotatedDelta, humanMiniMoves[humanMiniMoves.length - 1].toDelta)) {
      return false;
    }

    let hasMandatoryJump: boolean = humanMiniMoves.length > 0  || gameLogic.hasMandatoryJumps(board, yourPlayerIndex());
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
  function setDndElemPos(pos: TopLeft, cellSize: CellSize): void {
    let style: any = dndElem.style;
    let top: number = cellSize.height / 10;
    let left: number = cellSize.width / 10;
    let originalSize = getCellPos(dndStartPos.row, dndStartPos.col, cellSize);
    let deltaX: number = (pos.left - originalSize.left + left);
    let deltaY: number = (pos.top - originalSize.top + top);
    // make it 20% bigger (as if it's closer to the person dragging).
    let transform = "translate(" + deltaX + "px," + deltaY + "px) scale(1.2)";
    style['transform'] = transform;
    style['-webkit-transform'] = transform;
    style['will-change'] = "transform"; // https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
  }

  /**
   * Get the position of the cell.
   */
  function getCellPos(row: number, col: number, cellSize: CellSize): TopLeft {
    let top: number = row * cellSize.height;
    let left: number = col * cellSize.width;
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

  // Caching layer, to make angular more efficient.
  export let cachedBoardAvatar0: string;
  export let cachedBoardAvatar1: string;
  export let cachedBoardClass: string;
  export let cachedSquareClass: string[][] = getEmpty8Arrays();
  export let cachedPieceContainerClass: string[][] = getEmpty8Arrays();
  export let cachedPieceClass: string[][] = getEmpty8Arrays();
  export let cachedPieceSrc: string[][] = getEmpty8Arrays();
  export let cachedAvatarPieceCrown: string[][] = getEmpty8Arrays();
  function getEmpty8Arrays(): string[][] {
    let res: string[][] = [];
    for (let i = 0; i < 8; i++) res.push([]);
    return res;
  }
  export function updateCache() {
    cachedBoardAvatar0 = getBoardAvatar(0);
    cachedBoardAvatar1 = getBoardAvatar(1);
    cachedBoardClass = getBoardClass();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        cachedPieceSrc[row][col] = getPieceSrc(row, col); // Must be first (this cache is used in other functions)

        cachedSquareClass[row][col] = getSquareClass(row, col);
        cachedPieceContainerClass[row][col] = getPieceContainerClass(row, col);
        cachedPieceClass[row][col] = getPieceClass(row, col);
        cachedAvatarPieceCrown[row][col] = getAvatarPieceCrown(row, col);
      }
    }
  }
}

angular.module('myApp', ['gameServices'])
  .run(['$rootScope', '$interval',
    function ($rootScope: angular.IScope, $interval: angular.IIntervalService) {
      $rootScope['game'] = game;
      game.init($rootScope, $interval);
    }]);
