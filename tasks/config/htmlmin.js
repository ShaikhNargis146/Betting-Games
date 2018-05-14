module.exports = function(grunt) {
    grunt.config.set('htmlmin', {
        production: { // Another target
            files: [{
                expand: true, // Enable dynamic expansion.
                cwd: './frontend/', // Src matches are relative to this path.
                src: ['views/**/*.html'], // Actual pattern(s) to match.
                dest: '.tmp/public/frontend/', // Destination path prefix.
            }],
            options: { // Target options
                removeComments: true,
                collapseWhitespace: true
            },
        }
    });
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
};
