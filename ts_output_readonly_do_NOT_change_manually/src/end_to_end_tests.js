describe('Checkers E2E Test:', function () {
    browser.get('dist/index.min.html');
    it('Check properly initialized', function () {
        for (var i = 0; i < 64; i += 1) {
            var row = Math.floor(i / 8);
            var col = i % 8;
            var elem = element(by.id('img_' + row + '_' + col));
            var isPlayableSquare = (col % 2 === 0) !== (row % 2 === 0);
            if (row < 3 && isPlayableSquare) {
                expect(elem.getAttribute('src')).toBe("http://localhost:9000/dist/imgs/black_man.png");
            }
            else if (row >= 5 && isPlayableSquare) {
                expect(elem.getAttribute('src')).toBe("http://localhost:9000/dist/imgs/white_man.png");
            }
            else {
                expect(elem.isPresent()).toBe(false);
            }
        }
    });
});
//# sourceMappingURL=end_to_end_tests.js.map