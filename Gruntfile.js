module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ts: {
      default: {
        options: {
          fast: 'never' // disable the grunt-ts fast feature
        },
        tsconfig: true
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    copy: {
      imgs: {
        expand: true,
        src: 'imgs/*.*',
        dest: 'dist/'
      },
    },
    concat: {
      options: {
        separator: '\n;\n',
      },
      dist: {
        // Order is important! gameLogic.js must be first because it defines myApp angular module.
        // src: ['src/gameLogic.js', 'src/game.js', 'src/aiService.js'],
        src: ['ts_output_readonly_do_NOT_change_manually/src/gameLogic.js',
              'ts_output_readonly_do_NOT_change_manually/src/game.js',
            'ts_output_readonly_do_NOT_change_manually/src/aiService.js'],
        dest: 'dist/js/everything.js'
      }
    },
    postcss: {
      options: {
        map: {
          inline: false, // save all sourcemaps as separate files...
          annotation: 'dist/css/maps/' // ...to the specified directory
        },
        processors: [
          require('autoprefixer')(), // add vendor prefixes
          require('cssnano')() // minify the result
        ]
      },
      dist: {
        src: 'css/game.css',
        dest: 'dist/css/everything.min.css',
      }
    },
    uglify: {
      options: {
        sourceMap: true,
      },
      my_target: {
        files: {
          'dist/js/everything.min.js': ['dist/js/everything.js']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'dist/index.min.html': ['index.html']
        }
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular.min.js',
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-touch.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.12.1/ui-bootstrap-tpls.min.js',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css',
            // glyphicons for the carousel
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.woff',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.ttf',
            'http://yoav-zibin.github.io/emulator/dist/turnBasedServices.3.min.js',
            'http://yoav-zibin.github.io/emulator/main.css',
            'js/everything.min.js',
            'css/everything.min.css',
            "imgs/white_man.png",
            "imgs/black_man.png",
            "imgs/white_cro.png",
            "imgs/black_cro.png",
            "imgs/board.png",
          ],
          network: [
            'dist/everything.min.js.map',
            'dist/everything.js'
          ],
          timestamp: true
        },
        dest: 'dist/index.appcache',
        src: []
      }
    },
    'http-server': {
      'dev': {
        // the server root directory
        root: '.',
        port: 9000,
        host: "0.0.0.0",
        cache: 1,
        showDir : true,
        autoIndex: true,
        // server default file extension
        ext: "html",
        // run in parallel with other tasks
        runInBackground: true
      }
    },
    protractor: {
      options: {
        configFile: "protractor.conf.js", // Default config file
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false, // If true, protractor will not use colors in its output.
        args: {
          // Arguments passed to the command
        }
      },
      all: {}
    }
  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', [
      'ts',
      'karma',
      'copy',
      'concat', 'postcss', 'uglify',
      'processhtml', 'manifest',
      'http-server', 'protractor']);
};
