module.exports = function (grunt) {
    var folderName = grunt.option('target');
    var isProduction = grunt.option('production');
    if (isProduction) {
        grunt.registerTask('ui', ["ejs:ui", "sass:development", "cssmin:production", "concat:production", "uglify", "prod"]);
    } else {
        grunt.registerTask('ui', ["ejs:ui", "sass:development", "concurrent:watchDevelopment"]);
    }

};