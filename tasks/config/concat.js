/**
 * `concat`
 *
 * ---------------------------------------------------------------
 *
 * Concatenates the contents of multiple JavaScript and/or CSS files
 * into two new files, each located at `concat/production.js` and
 * `concat/production.css` respectively in `.tmp/public/concat`.
 *
 * This is used as an intermediate step to generate monolithic files
 * that can then be passed in to `uglify` and/or `cssmin` for minification.
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-concat
 *
 */

var _ = require("lodash");
module.exports = function (grunt) {
    var folderName = grunt.option('target');
    if (folderName) {
        var jsFiles = require("../../" + folderName + "/files.js");
        jsFiles = _.map(jsFiles, function (n) {
            if (n) {
                var firstText = _.head(_.split(n, "/"));
                if (firstText == "js") {
                    n = folderName + "/" + n;

                }
            }
            return n;
        });
        // console.log(jsFiles);
    }
    grunt.config.set('concat', {
        development: {
            options: {
                sourceMap: false
            },
            src: jsFiles,
            dest: folderName + '/js/main.js'
            // dest: '.tmp/public/concat/production.js'
        },
        production: {
            options: {
                sourceMap: false
            },
            src: jsFiles,
            dest: folderName + '/js/production.js'
            // dest: '.tmp/public/concat/production.js'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};