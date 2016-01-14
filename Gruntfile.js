var path = require('path');

var escapeChar     = process.platform.match(/^win/) ? '^' : '\\',
    cwd            = process.cwd().replace(/( |\(|\))/g, escapeChar + '$1');



module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	require('time-grunt')(grunt);
	//grunt.loadTasks('tasks');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: ['build/javascript/'],

		browserify: {
			dist: {
				options: {
					transform: [['babelify', { presets: ['es2015'] }], 'jadeify'],
					browserifyOptions: { debug: true },
					exclude: '',
					external: [
						'jquery',
						'underscore',
						'backbone',
						'bootstrap'
					]
				},
				files: {
					'build/javascript/setup.bundle.js': ['source/setup/app.js']
				}
			},

			vendor: {
				options: {
					transform: ['browserify-shim'],
					alias: [
						'jquery:',
						'underscore:',
						'backbone:',
						'bootstrap:'
					]
				},
				external: null,
				src: ['.'],
				dest: 'build/javascript/vendor.bundle.js'
			}
		},

		uglify: {
			dev: {
				options: {
					screwIE8: true,
					preserveComments: 'all',
					beautify: true,
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
				},
				files: {
					'build/javascript/setup.bundle.min.js': ['build/javascript/*.bundle.js']
				}
			},
			prod: {
				options: {
					screwIE8: true,
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
				},
				files: {
					'build/javascript/setup.bundle.min.js': ['build/javascript/setup.bundle.js'],
					'build/javascript/vendor.bundle.min.js': ['build/javascript/vendor.bundle.js']
				}
			}
		},

		eslint: {
			options: {
				format: require('eslint-tap'),
				configFile: '.eslintrc'
			},
			target: 'source/setup/**/*.js'
		},

		watch: {
			scripts: {
				files: ['source/**/*.js', 'source/*.js'],
				tasks: ['browserify']
			},
		},

		notify: {
			build: {
				options: {
					title: 'Build complete!',
					message: 'Setup was created successfully.'
				}
			}
		}
	});

	grunt.registerTask('build', ['browserify']);
	grunt.registerTask('prod', ['browserify', 'uglify:prod']);
	grunt.registerTask('default', ['watch']);
};
