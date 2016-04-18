module.exports = function(config) {

  'use strict';

  config.set({

    basePath : './',

    files : [
      'http://ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular.js',
      'ts_output_readonly_do_NOT_change_manually/src/gameLogic.js',
      'ts_output_readonly_do_NOT_change_manually/src/aiService.js',
      'http://yoav-zibin.github.io/emulator/dist/turnBasedServices.3.js',
      'ts_output_readonly_do_NOT_change_manually/src/gameLogic_test.js',
      'ts_output_readonly_do_NOT_change_manually/src/aiService_test.js'
    ],

    reporters: ['progress'], // , 'coverage'

    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'ts_output_readonly_do_NOT_change_manually/src/gameLogic.js': ['coverage']
    },

    // optionally, configure the reporter
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-coverage'
    ]

  });
};