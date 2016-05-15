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
        updateCache();
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
    /*
    TLDR: iOS has CORS problems with FB avatars, so I can only load FB images using a proxy.
  
    // On iOS and Safari, when loading:
    //  http://graph.facebook.com/10152824135331125/picture
    // it fails with "status":0, I see this errror in safari:
    // Failed to load resource: Request header field Accept-Encoding is not allowed by Access-Control-Allow-Headers.
    Nothing works...
    Finally found the issue, and there is nothing I can do about it:
    Safari doesn't set CORS on a redirect correctly:
    http://stackoverflow.com/questions/32332919/safari-fails-cors-request-after-302-redirect
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
    function getMaybeProxiedImgUrl(imgUrl) {
        // E.g.,
        // http://multiplayer-gaming.appspot.com/proxy/?fwdurl=http://graph.facebook.com/10153589934097337/picture?height=300&width=300
        return is_ios && isFbAvatar(imgUrl) ? 'http://multiplayer-gaming.appspot.com/proxy/?fwdurl=' + encodeURIComponent(imgUrl) :
            imgUrl;
    }
    // If any of the images has a loading error, we're probably offline, so we turn off the avatar customization.
    game.hadLoadingError = false;
    function onImgError() {
        if (game.hadLoadingError)
            return;
        game.hadLoadingError = true;
        updateCacheAndApply();
    }
    game.onImgError = onImgError;
    function updateCacheAndApply() {
        updateCache();
        $rootScope.$apply();
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
        var match = myAvatar.match(/graph[.]facebook[.]com[/](\w+)[/]/);
        if (!match)
            return '';
        var myFbUserId = match[1];
        return getMaybeProxiedImgUrl("http://graph.facebook.com/" + myFbUserId + "/picture?height=200&width=400");
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
        var avatarPieceSrc = game.cachedAvatarPieceSrc[row][col];
        if (!avatarPieceSrc)
            return "piece";
        var piece = getPiece(row, col);
        var pieceColor = gameLogic.getColor(piece);
        // Black&white are reversed in the UI because black should start. 
        return pieceColor === CONSTANTS.BLACK ? 'piece avatar_piece lighter_avatar_piece' : 'piece avatar_piece darker_avatar_piece';
    }
    game.getPieceClass = getPieceClass;
    function getAvatarPieceCrown(row, col) {
        var avatarPieceSrc = game.cachedAvatarPieceSrc[row][col];
        if (!avatarPieceSrc)
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
        return hasAvatarImgUrl(avatarImageUrl) ? getMaybeProxiedImgUrl(avatarImageUrl) :
            !isLocalTesting() ? '' :
                pieceColorIndex == 1 ? "http://graph.facebook.com/10153589934097337/picture" : "http://graph.facebook.com/10153693068502449/picture";
    }
    game.getAvatarPieceSrc = getAvatarPieceSrc;
    var dir = 'imgs/';
    var ext = '.png';
    var bm_img = dir + 'black_man' + ext;
    var bk_img = dir + 'black_cro' + ext;
    var wm_img = dir + 'white_man' + ext;
    var wk_img = dir + 'white_cro' + ext;
    function getPieceSrc(row, col) {
        var avatarPieceSrc = game.cachedAvatarPieceSrc[row][col];
        if (avatarPieceSrc)
            return avatarPieceSrc;
        var piece = getPiece(row, col);
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
                var transform = "scale(1.2)"; // make it slightly bigger (as if it's closer to the person dragging)
                style['transform'] = transform;
                style['-webkit-transform'] = transform;
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
    game.cachedSquareClass = getEmpty8Arrays();
    game.cachedPieceContainerClass = getEmpty8Arrays();
    game.cachedPieceClass = getEmpty8Arrays();
    game.cachedAvatarPieceSrc = getEmpty8Arrays(); // for more efficient computation (not used in the HTML)
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
                game.cachedAvatarPieceSrc[row][col] = getAvatarPieceSrc(row, col); // Must be first (this cache is used in other functions)
                game.cachedSquareClass[row][col] = getSquareClass(row, col);
                game.cachedPieceContainerClass[row][col] = getPieceContainerClass(row, col);
                game.cachedPieceClass[row][col] = getPieceClass(row, col);
                game.cachedPieceSrc[row][col] = getPieceSrc(row, col);
                game.cachedAvatarPieceCrown[row][col] = getAvatarPieceCrown(row, col);
            }
        }
    }
    game.updateCache = updateCache;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map