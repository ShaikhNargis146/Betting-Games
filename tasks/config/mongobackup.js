module.exports = function (grunt) {

    grunt.config.set('mongobackup', {
        dump: {
            options: {
                host: 'localhost',
                db: 'teenpatti',
                out: './dump'
            }
        },
        restore: {
            options: {
                db: 'teenpatti',
                host: 'localhost',
                drop: true,
                path: './dump/teenpatti'
            }
        },
    });

    grunt.loadNpmTasks('mongobackup');
};