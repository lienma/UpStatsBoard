var _          = require('lodash')
var fs         = require('fs');
var gulp       = require('gulp');
var Promise	   = require('bluebird')
var source     = require('vinyl-source-stream');
var del        = require('del');
var browserify = require('browserify');
var babelify   = require('babelify');
var cssnano    = require('gulp-cssnano');
var eslint     = require('gulp-eslint');
var livereload = require('gulp-livereload');
var stylus     = require('gulp-stylus');
var concatCss  = require('gulp-concat-css');
var sourcemaps = require('gulp-sourcemaps');

var Package = JSON.parse(fs.readFileSync('./package.json'));
var externalLibraries = _.keys(Package.browser);


gulp.task('build', ['clean', 'build-setup', 'build-vendor']);
gulp.task('build-setup', ['setup-scripts', 'setup-css']);
gulp.task('build-vendor', ['vendor-scripts', 'vendor-css', 'vender-fonts']);

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

gulp.task('setup-css', ['setup-css-bundle'], function () {
	return del('build/stylesheet/setup');
});


gulp.task('setup-css-bundle', ['setup-css-compile'], function () {
	return gulp.src('build/stylesheet/setup/*.css')
		.pipe(concatCss('setup.bundle.css'))
		.pipe(sourcemaps.init())
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('build/stylesheet/'));
});

gulp.task('setup-css-compile', function () {
	return gulp.src(['source/setup/stylesheets/*.styl', 'source/shared/stylesheets/*.styl'])
		.pipe(stylus())
		.pipe(gulp.dest('build/stylesheet/setup'));
});


gulp.task('setup-scripts', ['lint'], function () {
	return browserify({ debug: true })
		.transform(babelify)
		//.transform({ global: true, ignore: 'source/**/*.jade' }, 'uglifyify')
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
		.pipe(sourcemaps.init())
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
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
	gulp.watch([
		'source/setup/**/*.jade',
		'source/setup/**/*.js'
	], ['scripts-setup']);
});

