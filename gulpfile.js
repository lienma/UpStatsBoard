const _          = require('lodash')
const fs         = require('fs');
const gulp       = require('gulp');
const Promise	 = require('bluebird');
const source     = require('vinyl-source-stream');
const del        = require('del');
const browserify = require('browserify');
const babelify   = require('babelify');
const cssnano    = require('gulp-cssnano');
const eslint     = require('gulp-eslint');
const livereload = require('gulp-livereload');
const stylus     = require('gulp-stylus');
const concatCss  = require('gulp-concat-css');
const sourcemaps = require('gulp-sourcemaps');
const replace    = require('gulp-replace');


const Package = JSON.parse(fs.readFileSync('./package.json'));
const externalLibraries = _.keys(Package.browser);


gulp.task('build', ['clean', 'build-setup', 'build-vendor']);
gulp.task('build-setup', ['setup-scripts', 'setup-css']);
gulp.task('build-vendor', ['vendor-scripts', 'vendor-css', 'vender-fonts']);

gulp.task('clean', () => {
	return del([
		'build/fonts/**',
		'build/javascript/**',
		'build/stylesheet/**'
	]);
});

gulp.task('lint', () => {
	return gulp.src(['source/**/*.js', '!source/vendors/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('setup-css', ['setup-css-bundle'], () => {
	return del('build/stylesheet/setup');
});


gulp.task('setup-css-bundle', ['setup-css-compile'], () => {
	return gulp.src('build/stylesheet/setup/*.css')
		.pipe(concatCss('setup.bundle.css'))
		.pipe(sourcemaps.init())
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('build/stylesheet/'));
});

gulp.task('setup-css-compile', () => {
	return gulp.src(['source/setup/stylesheets/*.styl', 'source/shared/stylesheets/*.styl'])
		.pipe(stylus())
		.pipe(gulp.dest('build/stylesheet/setup'));
});


gulp.task('setup-scripts', ['lint'], () => {
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

gulp.task('vendor-scripts', () => {
	return browserify({ debug: true })
		.require(externalLibraries)
		.bundle()
		.pipe(source('vendor.bundle.js'))
		.pipe(gulp.dest('build/javascript/'));
});

gulp.task('vendor-css', () => {
	const cssFiles = _.values(Package['browser-css']);

	return gulp.src(cssFiles)
		.pipe(concatCss('vendor.bundle.css'))
		.pipe(sourcemaps.init())
		.pipe(replace(/..\/..\/..\/font-awesome\//g, '/'))
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('build/stylesheet/'));
});

gulp.task('vender-fonts', () => {
	const srcFiles = _.map(Package['browser-font'], (font) => font + '**/*.{ttf,woff,woff2,eof,svg,otf}' );
	return gulp.src(srcFiles).pipe(gulp.dest('build/fonts/'));
});

gulp.task('watch', () => {
	livereload.listen();
	gulp.watch([
		'source/setup/**/*.jade',
		'source/setup/**/*.js'
	], ['scripts-setup']);
});

