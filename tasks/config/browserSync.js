var historyApiFallback = require('connect-history-api-fallback');
module.exports = function (grunt) {
    var folderName = grunt.option('target') || "frontend";
    var route = {
        "/bower_components": "bower_components"
    };
    route["/" + folderName] = folderName;
    grunt.config.set('browserSync', {
        bsFiles: {
            src: [folderName + '/**/*.css', folderName + "/**/*.js", folderName + "/**/*.html", folderName + "/img/**"]
        },
        options: {
            server: {
                baseDir: folderName,
                routes: route,
                middleware: [historyApiFallback()]
            },
            port: 8080,
            notify: false,
            browser: "google chrome",
        }
    });

    grunt.loadNpmTasks('grunt-browser-sync');
};