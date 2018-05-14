var schema = new Schema({
    name: {
        type: String,
        required: true,
        excel: true,
    },
    email: {
        type: String,
        validate: validators.isEmail(),
        excel: "User Email",
        unique: true
    },
    dob: {
        type: Date,
        excel: {
            name: "Birthday",
            modify: function (val, data) {
                return moment(val).format("MMM DD YYYY");
            }
        }
    },
    photo: {
        type: String,
        default: "",
        excel: [{
            name: "Photo Val"
        }, {
            name: "Photo String",
            modify: function (val, data) {
                return "http://abc/" + val;
            }
        }, {
            name: "Photo Kebab",
            modify: function (val, data) {
                return data.name + " " + moment(data.dob).format("MMM DD YYYY");
            }
        }]
    },
    password: {
        type: String,
        default: ""
    },
    forgotPassword: {
        type: String,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    otp: {
        type: String,
        default: ""
    },
    accessToken: {
        type: [String],
        index: true
    },
    googleAccessToken: String,
    googleRefreshToken: String,
    oauthLogin: {
        type: [{
            socialId: String,
            socialProvider: String
        }],
        index: true
    },
    accessLevel: {
        type: String,
        default: "User",
        enum: ['User', 'Admin']
    }
});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('User', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user", "user"));
var model = {
    existsSocial: function (user, callback) {
        var Model = this;
        Model.findOne({
            "oauthLogin.socialId": user.id,
            "oauthLogin.socialProvider": user.provider,
        }).exec(function (err, data) {
            if (err) {
                callback(err, data);
            } else if (_.isEmpty(data)) {
                var modelUser = {
                    name: user.displayName,
                    accessToken: [uid(16)],
                    oauthLogin: [{
                        socialId: user.id,
                        socialProvider: user.provider,
                    }]
                };
                if (user.emails && user.emails.length > 0) {
                    modelUser.email = user.emails[0].value;
                    var envEmailIndex = _.indexOf(env.emails, modelUser.email);
                    if (envEmailIndex >= 0) {
                        modelUser.accessLevel = "Admin";
                    }
                }
                modelUser.googleAccessToken = user.googleAccessToken;
                modelUser.googleRefreshToken = user.googleRefreshToken;
                if (user.image && user.image.url) {
                    modelUser.photo = user.image.url;
                }
                Model.saveData(modelUser, function (err, data2) {
                    if (err) {
                        callback(err, data2);
                    } else {
                        data3 = data2.toObject();
                        delete data3.oauthLogin;
                        delete data3.password;
                        delete data3.forgotPassword;
                        delete data3.otp;
                        callback(err, data3);
                    }
                });
            } else {
                delete data.oauthLogin;
                delete data.password;
                delete data.forgotPassword;
                delete data.otp;
                data.googleAccessToken = user.googleAccessToken;
                data.save(function () {});
                callback(err, data);
            }
        });
    },
    profile: function (data, callback, getGoogle) {
        var str = "name email photo mobile accessLevel";
        if (getGoogle) {
            str += " googleAccessToken googleRefreshToken";
        }
        User.findOne({
            accessToken: data.accessToken
        }, str).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (data) {
                callback(null, data);
            } else {
                callback("No Data Found", data);
            }
        });
    },
    updateAccessToken: function (id, accessToken) {
        User.findOne({
            "_id": id
        }).exec(function (err, data) {
            data.googleAccessToken = accessToken;
            data.save(function () {});
        });
    },
    /**
     * This function get all the media from the id.
     * @param {userId} data
     * @param {callback} callback
     * @returns  that number, plus one.
     */
    getAllMedia: function (data, callback) {

    },

    /**
     * @function {function requestSend}
     * @param  {object} data     {body data}
     * @param  {callback} callback {description}
     * @return {type} {description}
     */
    requestSend: function (data, callback) {
        //console.log("data requestSend", data)
        var url = Config.backendUrl;

        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/getAccessLevel",
            body: {
                "accessToken": data.accessToken
            }
        };

        request(
            options,
            function (err, httpResponse, body) {

                if (body) {

                    callback(err, body.data);
                } else {
                    callback("Some Error");
                }

            });
    },
    returnMoney: function (data, callback) {
        var url = Config.backendUrl;
     //   console.log("data ", data);   
        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/returnMoney",
            body: {
                "accessToken": data.accessToken,
                "amount": data.totalAmount
            }
        };

        request(
            options,
            function (err, httpResponse, body) {
              //  console.log("body ", body);
                if (!err || body) {
                    var transaction = {
                        memberId: data.memberId,
                        amount: data.totalAmount,
                        type: 'win'
                    }
                    var transaction = new Transaction(transaction);
                    transaction.save(callback);
                 
                } else {
                    callback("Some Error");
                }

            });
    },
    winner: function (data, callback) {
        console.log("data winner", data)
        var url = Config.backendUrl;

        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/winMoney",
            body: {
                "amount": data.totalAmount,
                "game": "TeenPatti",
                "noCommission": data.noCommission,
                // "id":data.memberId
                "accessToken": data.accessToken
            }
        };

        request(
            options,
            function (err, httpResponse, body) {
               // console.log("body", body);
                if (err || _.isEmpty(body.data)) {
                    callback(err);
                } else {
                    async.parallel([
                        //     function (callback) {
                        //     Player.update({
                        //         _id: data._id
                        //     }, {
                        //         balance: body.data.creditLimit + body.data.balanceUp,
                        //         totalAmount: 0
                        //     }).exec(callback);
                        // }, 
                        function (callback) {
                            var transaction = {
                                memberId: data.memberId,
                                amount: data.totalAmount,
                                type: 'win'
                            }
                            var transaction = new Transaction(transaction);
                            transaction.save(callback);
                        }
                    ], callback);

                }
                // Player.blastSocket(data.tableId)
                // callback(null, body);
            });
    },
    getBalances: function (data, callback) {
        console.log("data getBalances", data)
        var url = Config.backendUrl;

        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/getCurrentBalance",
            body: {

                // "id":data.memberId
                "ids": data
            }
        };

        request(
            options,
            function (err, httpResponse, body) {
               // console.log("err body httpResponse", err, body);
                if (err || _.isEmpty(body)) {
                    callback(err);
                } else {
                    callback(err, body.data);
                }
            });
    },
    loose: function (data, callback) {

        var url = Config.backendUrl;

        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/loseMoney",
            body: {
                "amount": data.amount,
                "game": "TeenPatti",
                "tip": data.tip,
                // "id":data.memberId
                "accessToken": data.accessToken
            }
        };

        request(
            options,
            function (err, httpResponse, body) {
               // console.log("body", body);
                if (err || _.isEmpty(body.data)) {
                    callback(err);
                } else {
                    callback();

                }

            });
    },

    sendTip: function (data, callback) {
        console.log("data sendTip", data);
        var url = Config.backendUrl;

        var options = {
            method: 'post',
            json: true,
            url: url + "/api/Member/sendTip",
            body: {
                "amount": data.amount,
                "id": data.memberId
            }
        };

        request(
            options,
            function (err, httpResponse, body) {
               // console.log("body", body);

                callback(err, body);
            });
    },

};
module.exports = _.assign(module.exports, exports, model);