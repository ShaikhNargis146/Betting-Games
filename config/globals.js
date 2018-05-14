/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.globals.html
 */
module.exports.globals = {

    /****************************************************************************
     *                                                                           *
     * Expose the lodash installed in Sails core as a global variable. If this   *
     * is disabled, like any other node module you can always run npm install    *
     * lodash --save, then var _ = require('lodash') at the top of any file.     *
     *                                                                           *
     ****************************************************************************/

    _: false,

    /****************************************************************************
     *                                                                           *
     * Expose the async installed in Sails core as a global variable. If this is *
     * disabled, like any other node module you can always run npm install async *
     * --save, then var async = require('async') at the top of any file.         *
     *                                                                           *
     ****************************************************************************/

    async: false,

    /****************************************************************************
     *                                                                           *
     * Expose the sails instance representing your app. If this is disabled, you *
     * can still get access via req._sails.                                      *
     *                                                                           *
     ****************************************************************************/

    // sails: true,

    /****************************************************************************
     *                                                                           *
     * Expose each of your app's services as global variables (using their       *
     * "globalId"). E.g. a service defined in api/models/NaturalLanguage.js      *
     * would have a globalId of NaturalLanguage by default. If this is disabled, *
     * you can still access your services via sails.services.*                   *
     *                                                                           *
     ****************************************************************************/

    // services: true,

    /****************************************************************************
     *                                                                           *
     * Expose each of your app's models as global variables (using their         *
     * "globalId"). E.g. a model defined in api/models/User.js would have a      *
     * globalId of User by default. If this is disabled, you can still access    *
     * your models via sails.models.*.                                           *
     *                                                                           *
     ****************************************************************************/

    // models: true
};

// Mongoose Globals
global["ObjectId"] = mongoose.Types.ObjectId;
global["deepPopulate"] = require('mongoose-deep-populate')(mongoose);
global["uniqueValidator"] = require('mongoose-unique-validator');
global["timestamps"] = require('mongoose-timestamp');
global["validators"] = require('mongoose-validators');
global["monguurl"] = require('monguurl');
require('mongoose-middleware').initialize(mongoose);
global["Schema"] = mongoose.Schema;
global["http"] = require('http');


//Image Library
global["stream"] = require('stream');
global["Jimp"] = require("jimp");

// Util Globals
global["moment"] = require("moment");
global["exec"] = require('child_process').exec;
global["_"] = require('lodash');
global["chalk"] = require('chalk');
global["uid"] = require('rand-token').uid;
global["request"] = require('request');
global["fs"] = require('fs');
global["json2xls"] = require('json2xls');
global["xlsx"] = require('node-xlsx').default;
global["async"] = require('async');
global.getmid = require('node-machine-id').machineIdSync;
// global["pdf"] = require('html-pdf');

// passport Globals
global["passport"] = require('passport');
global["LocalStrategy"] = require('passport-local').Strategy;
global["FacebookStrategy"] = require('passport-facebook').Strategy;
global["TwitterStrategy"] = require('passport-twitter').Strategy;
global["GoogleStrategy"] = require('passport-google-auth').Strategy;

// teenpattisolver

global.teenPattiSolver = require('teenpattisolver');
// Files to Import
// global["jsFiles"] = require("../frontend/files.js");
// global["jsFilesBackend"] = require("../backend/files.js");

//colored console
global["blue"] = function (data) {
    console.log(chalk.blue(data));
};
global["red"] = function (data) {
    console.log(chalk.red(data));
};
global["green"] = function (data) {
    console.log(chalk.green(data));
};
global["log"] = function (data) {
    console.log(data);
};


// sending Emails using sendgrid


// libraries for serialport reading
// global.beep = require('beepbeep');
// global.SerialPort = require('serialport');