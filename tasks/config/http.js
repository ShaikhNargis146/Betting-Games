var moment = require("moment");
var production = require("../../config/env/production.js");

module.exports = function(grunt) {
    grunt.config.set('http', {
        deploy: {
            options: {
                url: production.realHost + "/gitPull/" + moment().unix(),
                callback: function(err, response, data) {
                    console.log(data);
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-http');
};
