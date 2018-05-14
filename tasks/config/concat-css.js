module.exports = function(grunt) {

    grunt.config.set('concat_css', {
        options: {
            sourceMap: true
        },
        all: {
            src: ["frontend/sass/main.css"],
            dest: "frontend/sass/complete.css"
        },
    });

    grunt.loadNpmTasks('grunt-concat-css');
};
