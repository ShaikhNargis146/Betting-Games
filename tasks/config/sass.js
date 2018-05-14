module.exports = function (grunt) {
    var folderName = grunt.option('target');
    var isProduction = grunt.option('production');
    var dev = {
        options: {
            sourceMap: !isProduction
        },
        files: {}
    };
    dev.files[folderName + "/css/import.css"] = folderName + "/sass/import.scss";
    grunt.config.set('sass', {
        development: dev,
    });
    grunt.loadNpmTasks('grunt-sass');
};