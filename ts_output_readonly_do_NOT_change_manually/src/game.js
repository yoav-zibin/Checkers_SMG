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
    /**
     * Send initial move
     */
    function init() {
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        console.log("Translation of 'CHECKERS_RULES_TITLE' is " + translate('CHECKERS_RULES_TITLE'));
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
                // Slightly bigger shadow (as if it's closer to you).
                var filter = "brightness(100%) drop-shadow(0.3rem 0.3rem 0.1rem black)";
                style['filter'] = filter;
                style['-webkit-filter'] = filter;
                var transform = "scale(1.2)"; // make it slightly bigger (as if it's closer to the person dragging)
                style['transform'] = transform;
                style['-webkit-transform'] = transform;
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