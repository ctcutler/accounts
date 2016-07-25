var gulp = require('gulp');
var Server = require('karma').Server;
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');

gulp.task('build', function (done) {
  browserify({
    entries: './js/src/main.js',
    debug: true
  }).transform(
    "babelify", {presets: ["es2015", "react"]}
  )
  .bundle()
  .on('error',gutil.log)
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('./web'));
});

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('tdd', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('default', ['tdd']);
