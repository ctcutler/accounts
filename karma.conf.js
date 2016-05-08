module.exports = function(config) {
  config.set({
    basePath: '',
    browsers: ['Chrome'],
    frameworks: ['browserify','jasmine'],
    files: [
      'js/src/**/*.js',
      'js/test/**/*.spec.js'
    ],
    //logLevel: 'LOG_DEBUG',
    preprocessors: {
      'js/src/**/*.js': [ 'browserify' ],
      'js/test/**/*.js': [ 'browserify' ],
    },
    browserify: {
      debug: true,
      transform: [["babelify", { "presets": ["es2015"] }]],
    }
  });
};
