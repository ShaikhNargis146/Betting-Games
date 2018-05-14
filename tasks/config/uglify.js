/**
 * `uglify`
 *
 * ---------------------------------------------------------------
 *
 * Minify client-side JavaScript files using UglifyJS.
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-uglify
 *
 */
module.exports = function (grunt) {
    var folderName = grunt.option('target') || "frontend";
    var isProduction = grunt.option('production');
    var obj = {
        files: {}
    };
    obj.files[folderName + '/js/production.min.js'] = folderName + '/js/production.js';



    grunt.config.set('uglify', {
        options: {
            mangle: false
        },
        production: obj
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
};