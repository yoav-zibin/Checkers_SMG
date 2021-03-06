function expectEmptyBrowserLogs() {
    browser.manage().logs().get('browser').then(function (browserLog) {
        // See if there are any errors (warnings are ok)
        var hasErrors = false;
        for (var _i = 0, browserLog_1 = browserLog; _i < browserLog_1.length; _i++) {
            var log_1 = browserLog_1[_i];
            var level = log_1.level.name;
            if (level === 'INFO' || level === 'WARNING')
                continue; // (warnings are ok)
            hasErrors = true;
        }
        if (hasErrors) {
            // It's better to pause, and look and console, then showing this which creates a lot of clutter:
            console.error("Browser has a warning/error in the logs. Opens the developer console and look at the logs.");
            //console.log('\n\n\nlog: ' + require('util').inspect(browserLog) + "\n\n\n");
            browser.pause();
        }
    });
}
var lastTest;
var JasmineOverrides;
(function (JasmineOverrides) {
    var jasmineAny = jasmine;
    var executeMock = jasmineAny.Spec.prototype.execute;
    var jasmineSpec = jasmineAny.Spec;
    jasmineSpec.prototype.execute = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        lastTest = this.result;
        executeMock.apply(this, args);
    };
    // Pause for expect failures
    var originalAddExpectationResult = jasmineSpec.prototype.addExpectationResult;
    jasmineSpec.prototype.addExpectationResult = function () {
        if (!arguments[0]) {
            console.error("\n\nFailure in test:\n" +
                arguments[1].message + "\n" +
                (arguments[1].error ? " stacktrace=\n\n" + arguments[1].error.stack : '') +
                "\n\n\n" +
                " Failure arguments=" + JSON.stringify(arguments));
            browser.pause();
        }
        return originalAddExpectationResult.apply(this, arguments);
    };
    // Pause on exception
    protractor.promise.controlFlow().on('uncaughtException', function (e) {
        console.error('Unhandled error: ' + e);
        browser.pause();
    });
})(JasmineOverrides || (JasmineOverrides = {}));
describe('Checkers E2E Test:', function () {
    browser.driver.manage().window().setSize(400, 600);
    browser.driver.manage().window().setPosition(10, 10);
    beforeEach(function () {
        console.log('\n\n\nRunning test: ', lastTest.fullName);
        browser.get('dist/index.min.html');
        waitForElement(element(by.id('game_iframe_0')));
        browser.driver.switchTo().frame('game_iframe_0');
        // It takes time for the game_iframe to load.
        waitForElement(element(by.id('img_container_0_0')));
    });
    afterEach(function () {
        expectEmptyBrowserLogs();
    });
    var startedExecutionTime = new Date().getTime();
    function log(msg) {
        var now = new Date().getTime();
        console.log("After " + (now - startedExecutionTime) + " milliseconds: " + msg);
    }
    function error(msg) {
        log(Array.prototype.slice.call(arguments).join(", "));
        browser.pause();
    }
    function safePromise(p) {
        if (!p)
            error("safePromise p = " + p);
        return p.then(function (x) { return x; }, function () { return false; });
    }
    function waitUntil(fn) {
        browser.driver.wait(fn, 10000).thenCatch(error);
    }
    function waitForElement(elem) {
        waitUntil(function () { return safePromise(elem.isPresent()).then(function (isPresent) { return isPresent &&
            safePromise(elem.isDisplayed()).then(function (isDisplayed) {
                return isDisplayed && safePromise(elem.isEnabled());
            }); }); });
        expect(elem.isDisplayed()).toBe(true);
    }
    function waitForElementToDisappear(elem) {
        waitUntil(function () { return safePromise(elem.isPresent()).then(function (isPresent) { return !isPresent ||
            safePromise(elem.isDisplayed()).then(function (isDisplayed) { return !isDisplayed; }); }); });
        // Element is either not present or not displayed.
    }
    it('Check properly initialized', function () {
        for (var i = 0; i < 64; i += 1) {
            var row = Math.floor(i / 8);
            var col = i % 8;
            var elem = element(by.id('e2e_test_img_' + row + '_' + col));
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