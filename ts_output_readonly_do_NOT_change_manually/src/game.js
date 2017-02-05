;
var game;
(function (game) {
    game.$rootScope = null;
    game.$interval = null;
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
    // If any of the images has a loading error, we're probably offline, so we turn off the avatar customization.
    game.hadLoadingError = false;
    // For community games.
    game.currentCommunityUI = null;
    game.proposals = null;
    game.yourPlayerInfo = null;
    function getTranslations() {
        return {};
    }
    function getStateForOgImage() {
        if (!game.currentUpdateUI) {
            log.warn("Got stateForOgImage without currentUpdateUI!");
            return;
        }
        var state = game.currentUpdateUI.state;
        if (!state)
            return '';
        var board = state.board;
        var boardStr = '';
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                // First row in state is top row, so I need to reverse rows.
                // Also, rotating the board if I'm index=1.
                var cell = game.currentUpdateUI.yourPlayerIndex == 1 ? board[row][7 - col] : board[7 - row][col];
                if (cell == "--" || cell == "DS") {
                    boardStr += "x";
                }
                else {
                    // switching white&black
                    var color = cell.substr(0, 1);
                    var kind = cell.substr(1, 1);
                    boardStr += (color == "W" ? "B" : "W") + kind;
                }
            }
        }
        return boardStr;
    }
    game.getStateForOgImage = getStateForOgImage;
    function init($rootScope_, $interval_) {
        game.$rootScope = $rootScope_;
        game.$interval = $interval_;
        log.alwaysLog("Checkers version 1.3");
        registerServiceWorker();
        gameArea = document.getElementById("gameArea");
        if (!gameArea)
            throw new Error("Can't find gameArea div!");
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        resizeGameAreaService.setWidthToHeight(1);
        gameService.setGame({
            updateUI: updateUI,
            getStateForOgImage: getStateForOgImage,
            communityUI: communityUI,
        });
        dragAndDropService.addDragListener("gameArea", handleDragEvent);
    }
    game.init = init;
    function registerServiceWorker() {
        // I prefer to use appCache over serviceWorker
        // (because iOS doesn't support serviceWorker, so we have to use appCache)
        // I've added this code for a future where all browsers support serviceWorker (so we can deprecate appCache!)
        if (!window.applicationCache && 'serviceWorker' in navigator) {
            var n = navigator;
            log.log('Calling serviceWorker.register');
            n.serviceWorker.register('service-worker.js').then(function (registration) {
                log.log('ServiceWorker registration successful with scope: ', registration.scope);
            }).catch(function (err) {
                log.log('ServiceWorker registration failed: ', err);
            });
        }
    }
    function setAnimationInterval() {
        game.animationInterval = game.$interval(advanceToNextAnimation, 700);
    }
    function clearAnimationInterval() {
        if (game.animationInterval) {
            game.$interval.cancel(game.animationInterval);
            game.animationInterval = null;
        }
    }
    function advanceToNextAnimation() {
        if (game.remainingAnimations.length == 0) {
            // The computer makes a move one tick (0.6sec) after the animations finished, to avoid stress on the UI thread.
            clearAnimationInterval();
            maybeSendComputerMove();
            updateCache();
            return;
        }
        var miniMove = game.remainingAnimations.shift();
        var iMove = gameLogic.createMiniMove(game.board, miniMove.fromDelta, miniMove.toDelta, 1 - game.currentUpdateUI.turnIndex);
        game.board = iMove.state.board;
        if (game.remainingAnimations.length == 0) {
            // Checking we got to the final correct board
            var expectedBoard = game.currentUpdateUI.state.board;
            if (!angular.equals(game.board, expectedBoard)) {
                throw new Error("Animations ended in a different board: expected=" + angular.toJson(expectedBoard, true) + " actual after animations=" + angular.toJson(game.board, true));
            }
        }
        updateCache();
    }
    function communityUI(communityUI) {
        game.currentCommunityUI = communityUI;
        log.info("Game got communityUI:", communityUI);
        // If only proposals changed, then do NOT call updateUI. Then update proposals.
        var nextUpdateUI = {
            playersInfo: [],
            playMode: communityUI.yourPlayerIndex,
            numberOfPlayers: communityUI.numberOfPlayers,
            state: communityUI.state,
            turnIndex: communityUI.turnIndex,
            endMatchScores: communityUI.endMatchScores,
            yourPlayerIndex: communityUI.yourPlayerIndex,
        };
        if (angular.equals(game.yourPlayerInfo, communityUI.yourPlayerInfo) &&
            game.currentUpdateUI && angular.equals(game.currentUpdateUI, nextUpdateUI)) {
        }
        else {
            // Things changed, so call updateUI.
            updateUI(nextUpdateUI);
        }
        // This must be after calling updateUI, because we nullify things there (like playerIdToProposal&proposals&etc)
        game.yourPlayerInfo = communityUI.yourPlayerInfo;
        var playerIdToProposal = communityUI.playerIdToProposal;
        game.didMakeMove = !!playerIdToProposal[communityUI.yourPlayerInfo.playerId];
        game.proposals = [];
        for (var i = 0; i < 8; i++) {
            game.proposals[i] = [];
            for (var j = 0; j < 8; j++) {
                game.proposals[i][j] = 0;
            }
        }
        for (var playerId in playerIdToProposal) {
            var proposal = playerIdToProposal[playerId];
            var miniMoves = proposal.data;
            var lastMiniMove = miniMoves[miniMoves.length - 1].toDelta;
            game.proposals[lastMiniMove.row][lastMiniMove.col]++;
        }
        updateCache();
    }
    game.communityUI = communityUI;
    function getProposal(row, col) {
        if (game.remainingAnimations.length > 0)
            return 0; // only show proposals after all animations.
        var rotatedDelta = rotate({ row: row, col: col });
        return game.proposals && game.proposals[rotatedDelta.row][rotatedDelta.col];
    }
    game.getProposal = getProposal;
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.hadLoadingError = false; // Retrying to load avatars every updateUI (maybe we're online again...)
        game.didMakeMove = false; // Only one move per updateUI
        game.currentUpdateUI = params;
        clearDragNDrop();
        game.humanMiniMoves = [];
        // We show animations if it's a non-human move or a move made by our opponents.
        // The move in multiplayer game have slightly different endMatchScores:
        // "endMatchScores":null  vs completley missing endMatchScores.
        // It's enought to check stateAfterMove anyway.
        var shouldAnimate = !game.lastHumanMove || !angular.equals(params.state, game.lastHumanMove.state);
        // lastHumanMove = null; On purpose not nullifying it because the platform may send the same updateUI again.
        //Rotate the board 180 degrees, hence in the point of current
        //player's view, the board always face towards him/her;
        game.shouldRotateBoard = params.playMode === 1;
        clearAnimationInterval();
        game.remainingAnimations = [];
        if (isFirstMove()) {
            game.board = gameLogic.getInitialBoard();
        }
        else if (!shouldAnimate || !params.state.boardBeforeMove) {
            game.board = params.state.board;
        }
        else {
            game.board = params.state.boardBeforeMove;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            game.remainingAnimations = angular.copy(params.state.miniMoves);
        }
        setAnimationInterval(); // I want to make the AI move in 0.6 seconds (to not pause the UI thread for too long)
        updateCache();
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
        if (!game.proposals) {
            gameService.makeMove(move);
        }
        else {
            var miniMoves = move.state.miniMoves;
            var lastMiniMove = miniMoves[miniMoves.length - 1].toDelta;
            var myProposal = {
                data: miniMoves,
                chatDescription: '' + (lastMiniMove.row + 1) + 'x' + (lastMiniMove.col + 1),
                playerInfo: game.yourPlayerInfo,
            };
            // Decide whether we make a move or not.
            if (game.proposals[lastMiniMove.row][lastMiniMove.col] < game.currentCommunityUI.numberOfPlayersRequiredToMove - 1) {
                move = null;
            }
            gameService.communityMove(myProposal, move);
        }
    }
    function isFirstMove() {
        return !game.currentUpdateUI.state;
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
            game.currentUpdateUI.turnIndex >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.turnIndex; // it's my turn
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
        game.$rootScope.$apply(function () {
            game.board = nextMove.state.board;
            game.humanMiniMoves.push(miniMove);
            // We finished our mega-move if it's now someone elses turn or game ended.
            if (nextMove.turnIndex !== game.currentUpdateUI.turnIndex) {
                var stateAfterMove = game.currentUpdateUI.state;
                game.lastHumanMove = nextMove = gameLogic.createMove(stateAfterMove ? stateAfterMove.board : gameLogic.getInitialBoard(), game.humanMiniMoves, yourPlayerIndex());
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
    var userAgent = navigator.userAgent.toLowerCase();
    var is_ios = userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipod") > -1 || userAgent.indexOf("ipad") > -1;
    function isFbAvatar(imgUrl) {
        return imgUrl.indexOf("graph.facebook.com") > 0;
    }
    var isHttps = location.protocol === "https:";
    function replaceProtocol(url) {
        return isHttps ? replaceToHttps(url) : replaceToHttp(url);
    }
    function replaceToHttps(url) {
        return replacePrefix(url, "http:", "https:");
    }
    function replaceToHttp(url) {
        return replacePrefix(url, "https:", "http:");
    }
    function replacePrefix(url, from, to) {
        return url.indexOf(from) === 0 ? to + url.substr(from.length) : url;
    }
    function getMaybeProxiedImgUrl(imgUrl) {
        // E.g.,
        // http://multiplayer-gaming.appspot.com/proxy/?fwdurl=http://graph.facebook.com/10153589934097337/picture?height=300&width=300
        return is_ios && isFbAvatar(imgUrl) ? '//multiplayer-gaming.appspot.com/proxy/?fwdurl=' +
            encodeURIComponent(replaceToHttp(imgUrl)) :
            replaceProtocol(imgUrl);
    }
    function onImgError() {
        if (game.hadLoadingError)
            return;
        game.hadLoadingError = true;
        updateCacheAndApply();
    }
    game.onImgError = onImgError;
    function updateCacheAndApply() {
        updateCache();
        game.$rootScope.$apply();
    }
    function isLocalTesting() { return location.protocol === "file:"; }
    function hasAvatarImgUrl(avatarImageUrl) {
        return avatarImageUrl && avatarImageUrl.indexOf('imgs/autoMatchAvatar.png') === -1;
    }
    function getBoardAvatar(playerIndex) {
        if (game.hadLoadingError)
            return '';
        // For local testing
        if (isLocalTesting())
            return "http://graph.facebook.com/" +
                (playerIndex == 1 ? "10153589934097337" : "10153693068502449") + "/picture?height=200&width=400";
        if (game.shouldRotateBoard)
            playerIndex = 1 - playerIndex;
        var myPlayerInfo = game.currentUpdateUI.playersInfo[playerIndex];
        if (!myPlayerInfo)
            return '';
        var myAvatar = myPlayerInfo.avatarImageUrl;
        if (!hasAvatarImgUrl(myAvatar))
            return '';
        // I only do it for FB users
        var myFbUserId = getFbUserId(myAvatar);
        return getMaybeProxiedImgUrl("http://graph.facebook.com/" + myFbUserId + "/picture?height=200&width=400");
    }
    game.getBoardAvatar = getBoardAvatar;
    function getFbUserId(avatarImageUrl) {
        var match = avatarImageUrl.match(/graph[.]facebook[.]com[/](\w+)[/]/);
        if (!match)
            return '';
        return match[1];
    }
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
    function getCellStyle(row, col) {
        var count = getProposal(row, col);
        if (!count)
            return;
        // proposals[row][col] is > 0
        var countZeroBased = count - 1;
        var maxCount = game.currentCommunityUI.numberOfPlayersRequiredToMove - 2;
        var ratio = maxCount == 0 ? 1 : countZeroBased / maxCount; // a number between 0 and 1 (inclusive).
        // scale will be between 0.6 and 0.8.
        var scale = 0.6 + 0.2 * ratio;
        // opacity between 0.5 and 0.7
        var opacity = 0.5 + 0.2 * ratio;
        return {
            transform: "scale(" + scale + ", " + scale + ")",
            opacity: "" + opacity,
        };
    }
    game.getCellStyle = getCellStyle;
    function getPieceClass(row, col) {
        var pieceSrc = game.cachedPieceSrc[row][col];
        if (!isAvatarPiece(pieceSrc)) {
            return 'piece';
        }
        var piece = getPiece(row, col);
        var pieceColor = gameLogic.getColor(piece);
        // Black&white are reversed in the UI because black should start.
        return pieceColor === CONSTANTS.BLACK ? 'piece avatar_piece lighter_avatar_piece' : 'piece avatar_piece darker_avatar_piece';
    }
    game.getPieceClass = getPieceClass;
    function getAvatarPieceCrown(row, col) {
        var pieceSrc = game.cachedPieceSrc[row][col];
        if (!isAvatarPiece(pieceSrc))
            return '';
        var piece = getPiece(row, col);
        var pieceKind = gameLogic.getKind(piece);
        if (pieceKind !== CONSTANTS.KING)
            return '';
        var pieceColor = gameLogic.getColor(piece);
        return pieceColor === CONSTANTS.BLACK ?
            "imgs/avatar_white_crown.svg" : "imgs/avatar_black_crown.svg";
    }
    game.getAvatarPieceCrown = getAvatarPieceCrown;
    function isAvatarPiece(img) {
        return img && img != bm_img && img != bk_img && img != wm_img && img != wk_img;
    }
    var dir = 'imgs/';
    var ext = '.png';
    var bm_img = dir + 'black_man' + ext;
    var bk_img = dir + 'black_cro' + ext;
    var wm_img = dir + 'white_man' + ext;
    var wk_img = dir + 'white_cro' + ext;
    function getPieceSrc(row, col) {
        if (game.hadLoadingError)
            return '';
        var piece = getPiece(row, col);
        if (piece == 'DS' && getProposal(row, col) > 0)
            piece = yourPlayerIndex() == 0 ? 'WM' : 'BM';
        if (piece == '--' || piece == 'DS') {
            return '';
        }
        var pieceColor = gameLogic.getColor(piece);
        var pieceColorIndex = pieceColor === CONSTANTS.BLACK ? 1 : 0;
        var myPlayerInfo = game.currentUpdateUI.playersInfo[pieceColorIndex];
        if (myPlayerInfo) {
            // Maybe use FB avatars
            var avatarImageUrl = myPlayerInfo.avatarImageUrl;
            var avatarPieceSrc = hasAvatarImgUrl(avatarImageUrl) ? getMaybeProxiedImgUrl(avatarImageUrl) :
                !isLocalTesting() ? '' :
                    pieceColorIndex == 1 ? "http://graph.facebook.com/10153589934097337/picture" : "http://graph.facebook.com/10153693068502449/picture";
            if (avatarPieceSrc)
                return avatarPieceSrc;
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
                setDndElemPos(dndPos, cellSize);
                updateCacheAndApply(); // To show the droppable squares, see .can_drop_on_square
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
            updateCacheAndApply(); // To show the draggable squares, see .can_drag_from_square
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
        // The same piece must make all the jumps!
        if (game.humanMiniMoves.length > 0 && !angular.equals(rotatedDelta, game.humanMiniMoves[game.humanMiniMoves.length - 1].toDelta)) {
            return false;
        }
        var hasMandatoryJump = game.humanMiniMoves.length > 0 || gameLogic.hasMandatoryJumps(game.board, yourPlayerIndex());
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
        var style = game.dndElem.style;
        var top = cellSize.height / 10;
        var left = cellSize.width / 10;
        var originalSize = getCellPos(game.dndStartPos.row, game.dndStartPos.col, cellSize);
        var deltaX = (pos.left - originalSize.left + left);
        var deltaY = (pos.top - originalSize.top + top);
        // make it 20% bigger (as if it's closer to the person dragging).
        var transform = "translate(" + deltaX + "px," + deltaY + "px) scale(1.2)";
        style['transform'] = transform;
        style['-webkit-transform'] = transform;
        style['will-change'] = "transform"; // https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
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
    game.cachedSquareClass = getEmpty8Arrays();
    game.cachedPieceContainerClass = getEmpty8Arrays();
    game.cachedPieceClass = getEmpty8Arrays();
    game.cachedPieceSrc = getEmpty8Arrays();
    game.cachedAvatarPieceCrown = getEmpty8Arrays();
    function getEmpty8Arrays() {
        var res = [];
        for (var i = 0; i < 8; i++)
            res.push([]);
        return res;
    }
    function updateCache() {
        game.cachedBoardAvatar0 = getBoardAvatar(0);
        game.cachedBoardAvatar1 = getBoardAvatar(1);
        game.cachedBoardClass = getBoardClass();
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                game.cachedPieceSrc[row][col] = getPieceSrc(row, col); // Must be first (this cache is used in other functions)
                game.cachedSquareClass[row][col] = getSquareClass(row, col);
                game.cachedPieceContainerClass[row][col] = getPieceContainerClass(row, col);
                game.cachedPieceClass[row][col] = getPieceClass(row, col);
                game.cachedAvatarPieceCrown[row][col] = getAvatarPieceCrown(row, col);
            }
        }
    }
    game.updateCache = updateCache;
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(['$rootScope', '$interval',
    function ($rootScope, $interval) {
        $rootScope['game'] = game;
        game.init($rootScope, $interval);
    }]);
//# sourceMappingURL=game.js.map