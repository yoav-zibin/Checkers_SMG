describe("aiService", function() {
  function createComputerMove(board: Board, turnIndex: number): IMove {
    return aiService.createComputerMove(board, turnIndex, {maxDepth: 1});
  }

  it("returns a legal regular move", function() {
    let move = createComputerMove(
      [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
      ], 0);
    let expectedMove: IMove = {
      stateAfterMove : {
        board: [
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ],
        miniMoves: [{fromDelta: {row: 3, col: 0}, toDelta: {row: 2, col: 1}}]
      },
      endMatchScores: null,
      turnIndexAfterMove: 1
    };
    expect(angular.equals(move, expectedMove)).toBe(true);
  });
  
  it("returns a legal jump (mega) move", function() {
    let move = createComputerMove(
      [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
      ], 1);
    let expectedMove: IMove = {
      stateAfterMove : {
        board: [
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
          ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
          ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ],
        miniMoves: [
          {fromDelta: {row: 0, col: 7}, toDelta: {row: 2, col: 5}},
          {fromDelta: {row: 2, col: 5}, toDelta: {row: 4, col: 7}},
          {fromDelta: {row: 4, col: 7}, toDelta: {row: 6, col: 5}},
        ]
      },
      endMatchScores: [0, 1],
      turnIndexAfterMove: -1
    };
    expect(angular.equals(move, expectedMove)).toBe(true);
  });
  
  
  it("Another mega move", function () {
    let move = createComputerMove([
        ["--","DS","--","DS","--","DS","--","DS"],
        ["BM","--","BM","--","DS","--","DS","--"],
        ["--","DS","--","DS","--","DS","--","DS"],
        ["BM","--","BM","--","DS","--","DS","--"],
        ["--","WM","--","BM","--","DS","--","DS"],
        ["DS","--","BM","--","DS","--","BM","--"],
        ["--","WM","--","DS","--","BM","--","DS"],
        ["WM","--","DS","--","DS","--","DS","--"]
      ], 1);
    let expectedMove: IMove = {
      stateAfterMove : {
        board: [
        ["--","DS","--","DS","--","DS","--","DS"],
        ["BM","--","BM","--","DS","--","DS","--"],
        ["--","DS","--","DS","--","DS","--","DS"],
        ["BM","--","DS","--","DS","--","DS","--"],
        ["--","DS","--","BM","--","DS","--","DS"],
        ["DS","--","BM","--","DS","--","BM","--"],
        ["--","DS","--","DS","--","BM","--","DS"],
        ["WM","--","BK","--","DS","--","DS","--"]
        ],
        miniMoves: [
          {fromDelta: {row: 3, col: 2}, toDelta: {row: 5, col: 0}},
          {fromDelta: {row: 5, col: 0}, toDelta: {row: 7, col: 2}},
        ]
      },
      endMatchScores: null,
      turnIndexAfterMove: 0
    };
    expect(angular.equals(move, expectedMove)).toBe(true);
  });

});