// This file has end-to-end tests using protractor, see:
// https://github.com/angular/protractor/blob/master/docs/toc.md 
declare var require: (module: string) => any;
function expectEmptyBrowserLogs() {
  browser.manage().logs().get('browser').then(function(browserLog) {
    // See if there are any errors (warnings are ok)
    let hasErrors = false;
    for (let log of browserLog) {
      let level = log.level.name;
      if (level === 'INFO' || level === 'WARNING') continue; // (warnings are ok)
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

let lastTest: any;
module JasmineOverrides {
  let jasmineAny = (<any>jasmine);
  let executeMock = jasmineAny.Spec.prototype.execute
  let jasmineSpec = jasmineAny.Spec;
  jasmineSpec.prototype.execute = function (...args: any[]) {
      lastTest = this.result;
      executeMock.apply(this, args);
  };
  // Pause for expect failures
  let originalAddExpectationResult = jasmineSpec.prototype.addExpectationResult;
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
  protractor.promise.controlFlow().on('uncaughtException', function(e: any) {
    console.error('Unhandled error: ' + e);
    browser.pause();
  });
}

describe('Checkers E2E Test:', function () {
  browser.driver.manage().window().setSize(400, 600);
  browser.driver.manage().window().setPosition(10, 10);
  
  let checkNoErrorInLogsIntervalId: number = null;
  beforeEach(()=>{
    console.log('\n\n\nRunning test: ', lastTest.fullName);
    checkNoErrorInLogsIntervalId = setInterval(expectEmptyBrowserLogs, 100);
    browser.get('dist/index.min.html');
  });
  afterEach(()=>{
    expectEmptyBrowserLogs();
    clearInterval(checkNoErrorInLogsIntervalId);
  });
  

  it('Check properly initialized', function () { 
    for (let i = 0; i < 64; i += 1) {
      let row = Math.floor(i / 8);
      let col = i % 8;
      let elem = element(by.id('e2e_test_img_' + row + '_' + col));
      let isPlayableSquare = (col % 2 === 0) !== (row % 2 === 0);
      if (row < 3 && isPlayableSquare) {
        expect(elem.getAttribute('src')).toBe("http://localhost:9000/dist/imgs/black_man.png");
      } else if (row >= 5 && isPlayableSquare) {
        expect(elem.getAttribute('src')).toBe("http://localhost:9000/dist/imgs/white_man.png");
      } else {
        expect(elem.isPresent()).toBe(false);
      }
    }
  });

});
