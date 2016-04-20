;
var game;
(function (game) {
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
    game.remainingAnimations = [];
    game.animationInterval = null;
    // for drag-n-drop and ai move animations
    game.dndStartPos = null;
    game.dndElem = null;
    function getTranslations() {
        return {
            "RULES_OF_CHECKERS": {
                en: "Rules of Checkers",
                zh: "英国跳棋规则",
            },
            "RULES_SLIDE1": {
                en: "Regular pieces move one step diagonally forward.",
                zh: "\"未成王\"的棋子只能斜着走向前方临近的空格子。吃子时，敌方的棋子必须是在前方斜方向临近的格子里，而且该敌方棋子的对应的斜方格子里必须没有棋子。只要斜前方还有可以吃的子，便可以多次吃子。",
            },
            "RULES_SLIDE2": {
                en: "When a man reaches the final row, it becomes a king, which can also move backwards.",
                zh: "当棋子到底线停下时，它就\"成王\"，以后便可以向后移动，同时多次吃子是也可以向后吃子。",
            },
            "RULES_SLIDE3": {
                en: "Capturing is mandatory, by jumping over an adjacent opponent piece. Multiple successive jumps do not need to be in the same line but may \"zigzag\" (change diagonal direction).",
                zh: "若一枚棋子可以吃棋，它必须吃。棋子可以连吃。即是说，若一枚棋子吃过敌方的棋子后，若它新的位置亦可以吃敌方的另一些敌方棋子，它必须再吃，直到无法再吃为止。",
            },
            "RULES_SLIDE4": {
                en: "The player without pieces remaining, or who cannot move due to being blocked, loses the game.",
                zh: "若一位玩家没法行走或所有棋子均被吃去便算输。",
            },
            "CLOSE": {
                en: "Close",
                zh: "继续游戏",
            },
        };
    }
    /**
     * Send initial move
     */
    function init() {
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
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
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
        if (game.remainingAnimations.length == 0)
            return;
        var miniMove = game.remainingAnimations.shift();
        var iMove = gameLogic.createMiniMove(game.board, miniMove.fromDelta, miniMove.toDelta, game.currentUpdateUI.turnIndexBeforeMove);
        game.board = iMove.stateAfterMove.board;
        if (game.remainingAnimations.length == 0) {
            clearAnimationInterval();
            // Checking we got to the corrent board
            var expectedBoard = game.currentUpdateUI.move.stateAfterMove.board;
            if (!angular.equals(game.board, expectedBoard)) {
                throw new Error("Animations ended in a different board: expected=" + angular.toJson(expectedBoard, true) + " actual after animations=" + angular.toJson(game.board, true));
            }
            maybeSendComputerMove();
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
        game.isHelpModalShown = false;
        game.currentUpdateUI = params;
        clearDragNDrop();
        //Rotate the board 180 degrees, hence in the point of current
        //player's view, the board always face towards him/her;
        game.shouldRotateBoard = params.playMode === 1;
        clearAnimationInterval();
        if (isFirstMove()) {
            game.board = gameLogic.getInitialBoard();
            game.remainingAnimations = [];
            // This is the first move in the match, so
            // there is not going to be an animation, so
            // call maybeSendComputerMove() now (can happen in ?onlyAIs mode)
            maybeSendComputerMove();
        }
        else {
            game.board = params.stateBeforeMove ? params.stateBeforeMove.board : gameLogic.getInitialBoard();
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.  
            game.remainingAnimations = angular.copy(params.move.stateAfterMove.miniMoves);
            game.animationInterval = $interval(advanceToNextAnimation, 500);
        }
    }
    function maybeSendComputerMove() {
        if (!isComputerTurn())
            return;
        var move = aiService.createComputerMove(game.board, yourPlayerIndex(), { millisecondsLimit: 1000 });
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
        return game.currentUpdateUI.playersInfo[game.currentUpdateUI.yourPlayerIndex].playerId === '';
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
        // TODO collect minimoves and make a mega one.
        var nextMove = null;
        try {
            nextMove = gameLogic.createMove(angular.copy(game.board), [{ fromDelta: fromDelta, toDelta: toDelta }], yourPlayerIndex());
        }
        catch (e) {
            log.info(["Move is illegal:", e]);
            return;
        }
        // Move is legal, make it!
        makeMove(nextMove);
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
        var isEvenRow = row % 2 === 0;
        var isEvenCol = col % 2 === 0;
        return ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol));
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
    /**
     * Check if there's a piece within the cell.
     */
    function hasPiece(row, col) {
        var rotatedDelta = rotate({ row: row, col: col });
        return isDarkCell(rotatedDelta.row, rotatedDelta.col) &&
            game.board &&
            game.board[rotatedDelta.row][rotatedDelta.col] !== 'DS';
    }
    game.hasPiece = hasPiece;
    function getPieceSrc(row, col) {
        var rotatedDelta = rotate({ row: row, col: col });
        var dir = 'imgs/';
        var ext = '.png';
        if (hasPiece(row, col)) {
            switch (game.board[rotatedDelta.row][rotatedDelta.col]) {
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
    game.getPieceSrc = getPieceSrc;
    function clearDragNDrop() {
        game.dndStartPos = null;
        if (game.dndElem)
            game.dndElem.removeAttribute("style");
        game.dndElem = null;
    }
    function handleDragEvent(type, cx, cy) {
        gameArea = document.getElementById("gameArea");
        var cellSize = getCellSize();
        // Make sure the player can not drag the piece outside of the board
        var x = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
        var y = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);
        var dndPos = {
            top: y - cellSize.height * 0.605,
            left: x - cellSize.width * 0.605
        };
        var delta = {
            row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
            col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
        };
        var rotatedDelta = rotate(delta);
        if (type === "touchstart" && canDrag(delta.row, delta.col)) {
            // If a piece is dragged, store the piece element
            if (hasPiece(delta.row, delta.col) &&
                isHumanTurn() &&
                isOwnColor(rotatedDelta)) {
                game.dndStartPos = angular.copy(delta);
                game.dndElem = document.getElementById("img_" + game.dndStartPos.row + "_" + game.dndStartPos.col);
                var style = game.dndElem.style;
                style['z-index'] = 20;
                var filter = "brightness(100%) drop-shadow(0.3rem 0.3rem 0.1rem black)";
                style['filter'] = filter;
                style['-webkit-filter'] = filter;
                setDndElemPos(dndPos);
            }
        }
        else if (type === "touchend" && game.dndStartPos) {
            // Drop a piece
            var from = { row: game.dndStartPos.row, col: game.dndStartPos.col };
            var to = { row: delta.row, col: delta.col };
            makeMiniMove(rotate(from), rotate(to));
            setDndElemPos(getCellPos(game.dndStartPos.row, game.dndStartPos.col));
            clearDragNDrop();
        }
        else if (type === 'touchmove' && game.dndStartPos) {
            // Dragging around
            setDndElemPos(dndPos);
        }
        // Clean up
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            clearDragNDrop();
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
    function canDrag(row, col) {
        var delta = { row: row, col: col };
        var rotatedDelta = rotate(delta);
        if (!isDarkCell(row, col) || !gameLogic.isOwnColor(yourPlayerIndex(), game.board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
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
    function setDndElemPos(pos) {
        var size = getCellSize();
        var top = size.height / 10;
        var left = size.width / 10;
        var originalSize = getCellPos(game.dndStartPos.row, game.dndStartPos.col);
        if (game.dndElem !== null) {
            game.dndElem.style.left = (pos.left - originalSize.left + left) + "px";
            game.dndElem.style.top = (pos.top - originalSize.top + top) + "px";
        }
    }
    /**
     * Get the position of the cell.
     */
    function getCellPos(row, col) {
        var size = getCellSize();
        var top = row * size.height;
        var left = col * size.width;
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