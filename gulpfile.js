var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var del        = require('del');
var browserify = require('browserify');
var babelify   = require('babelify');
var eslint     = require('gulp-eslint');

gulp.task('clean', function(cb) {
	del(['build/javascript'], cb);
});

gulp.task('lint', function () {
	return gulp.src(['source/**/*.js', '!source/vendors/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('scripts-setup', function() {
	return browserify({ debug: true })
		.transform(babelify)
		.external([ 'jquery', 'underscore', 'backbone', 'bootstrap' ])
		.require('source/setup/app.js', { entry: true })
		.bundle()
		.on('error', function (err) { console.log('Error: ' + err.message); })
		.pipe(source('setup.bundle.js'))
		.pipe(gulp.dest('build/javascript/'));
});

gulp.task('scripts-vendor', function () {
	return browserify({ debug: true })
		.require([ 'jquery', 'underscore', 'backbone', 'bootstrap' ])
		.bundle()
		.pipe(source('vendor.bundle.js'))
		.pipe(gulp.dest('build/javascript/'));
});

gulp.task('build', ['lint', 'scripts-setup', 'scripts-vendor'], function () {
	
});
