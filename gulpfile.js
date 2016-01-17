var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var del        = require('del');
var browserify = require('browserify');
var babelify   = require('babelify');
var eslint     = require('gulp-eslint');
var livereload = require('gulp-livereload');

gulp.task('clean', function(cb) {
	del(['build/javascript'], cb);
});

gulp.task('lint', function () {
	return gulp.src(['source/**/*.js', '!source/vendors/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('scripts-setup', ['lint'], function() {
	return browserify({ debug: true })
		.transform(babelify)
		.external([ 'backbone', 'bootstrap', 'jquery', 'jquery-ui', 'numeral', 'underscore' ])
		.require('source/setup/app.js', { entry: true })
		.bundle()
		.on('error', function (err) { console.log('Error: ' + err.message); })
		.pipe(source('setup.bundle.js'))
		.pipe(gulp.dest('build/javascript/'))
		.pipe(livereload());
});

gulp.task('scripts-vendor', function () {
	return browserify({ debug: true })
		.require([ 'backbone', 'bootstrap', 'jquery', 'jquery-ui', 'numeral', 'underscore' ])
		.bundle()
		.pipe(source('vendor.bundle.js'))
		.pipe(gulp.dest('build/javascript/'));
});

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch('source/setup/**/*.js', ['scripts-setup']);
});

gulp.task('build', ['lint', 'scripts-setup', 'scripts-vendor'], function () {
	
});
