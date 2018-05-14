module.exports = function (grunt) {

    grunt.config.set('postcss', {

        options: {
            map: false,
            processors: [
                require('autoprefixer')
            ],
            writeDest: true
        },
        dist: {
            src: 'frontend/css/*.css'
        }
    });

    grunt.loadNpmTasks('grunt-postcss');
};