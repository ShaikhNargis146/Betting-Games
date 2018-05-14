module.exports = function (grunt) {
    var folderName = grunt.option('target');
    grunt.config.set('watch', {
        sass: {
            // Assets to watch:
            files: [folderName + '/sass/**'],
            tasks: ['sass:development', "postcss"]
        },
        copyViews: {
            // Assets to watch:
            files: ['frontend/views/**'],
            tasks: ['copy:development']
        },
        copyImg: {
            // Assets to watch:
            files: ['frontend/img/**'],
            tasks: ['copy:development']
        },
        copyFonts: {
            // Assets to watch:
            files: ['frontend/fonts/**'],
            tasks: ['copy:development']
        },
        js: {
            // Assets to watch:
            files: ['frontend/js/**'],
            tasks: ['copy:jsDevelopment']
        },
        backendSass: {
            // Assets to watch:
            files: ['backend/sass/**'],
            tasks: ['sass:backendDevelopment']
        },
        backendCopyViews: {
            // Assets to watch:
            files: ['backend/views/**'],
            tasks: ['copy:backendDevelopmentViews']
        },
        backendCopyImg: {
            // Assets to watch:
            files: ['backend/img/**'],
            tasks: ['copy:backendDevelopmentImg']
        },
        backendCopyFonts: {
            // Assets to watch:
            files: ['backend/fonts/**'],
            tasks: ['copy:backendDevelopmentFonts']
        },
        backendCopyPageJson: {
            // Assets to watch:
            files: ['backend/pagejson/**'],
            tasks: ['copy:backendDevelopmentPageJson']
        },
        backendJs: {
            // Assets to watch:
            files: ['backend/js/**'],
            tasks: ['copy:jsBackendDevelopment']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};