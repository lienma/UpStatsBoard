var _          = require('lodash')
var fs         = require('fs');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var del        = require('del');
var browserify = require('browserify');
var babelify   = require('babelify');
var eslint     = require('gulp-eslint');
var livereload = require('gulp-livereload');
var concatCss  = require('gulp-concat-css');
var minifyCss  = require('gulp-minify-css');

var Package = JSON.parse(fs.readFileSync('./package.json'));
var externalLibraries = _.keys(Package.browser);


gulp.task('build', ['clean', 'scripts-setup', 'build-vendor'], function () {

});

gulp.task('build-vendor', ['vendor-scripts', 'vendor-css', 'vender-fonts'], function () {

});

gulp.task('clean', function () {
	return del([
		'build/fonts',
		'build/javascript',
		'build/stylesheet'
	]);
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
		.external(externalLibraries)
		.require('source/setup/app.js', { entry: true })
		.bundle()
		.on('error', function (err) { console.log('Error: ' + err.message); })
		.pipe(source('setup.bundle.js'))
		.pipe(gulp.dest('build/javascript/'))
		.pipe(livereload());
});

gulp.task('vendor-scripts', function () {
	return browserify({ debug: true })
		.require(externalLibraries)
		.bundle()
		.pipe(source('vendor.bundle.js'))
		.pipe(gulp.dest('build/javascript/'));
});

gulp.task('vendor-css', function () {
	var cssFiles = _.values(Package['browser-css']);

	return gulp.src(cssFiles)
		.pipe(concatCss('vendor.bundle.css'))
		.pipe(gulp.dest('build/stylesheet/'));
});

gulp.task('vender-fonts', function () {
	var srcFiles = _.map(Package['browser-font'], function (font) {
		return font + '**/*.{ttf,woff,woff2,eof,svg,otf}';
	});
	return gulp.src(srcFiles)
		.pipe(gulp.dest('build/fonts/'));
});

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch('source/setup/**/*.js', ['scripts-setup']);
});

