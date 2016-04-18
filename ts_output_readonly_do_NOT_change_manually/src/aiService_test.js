describe("aiService", function () {
    function createComputerMove(board, turnIndex) {
        return aiService.createComputerMove(board, turnIndex, { maxDepth: 1 });
    }
    it("returns a legal regular move", function () {
        var move = createComputerMove([
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], 0);
        var expectedMove = {
            stateAfterMove: {
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
                miniMoves: [{ fromDelta: { row: 3, col: 0 }, toDelta: { row: 2, col: 1 } }]
            },
            endMatchScores: null,
            turnIndexAfterMove: 1
        };
        expect(angular.equals(move, expectedMove)).toBe(true);
    });
    it("returns a legal jump (mega) move", function () {
        var move = createComputerMove([
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
        ], 1);
        var expectedMove = {
            stateAfterMove: {
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
                    { fromDelta: { row: 0, col: 7 }, toDelta: { row: 2, col: 5 } },
                    { fromDelta: { row: 2, col: 5 }, toDelta: { row: 4, col: 7 } },
                    { fromDelta: { row: 4, col: 7 }, toDelta: { row: 6, col: 5 } },
                ]
            },
            endMatchScores: [0, 1],
            turnIndexAfterMove: -1
        };
        expect(angular.equals(move, expectedMove)).toBe(true);
    });
});
//# sourceMappingURL=aiService_test.js.map