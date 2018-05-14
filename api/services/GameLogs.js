var schema = new Schema({
    players: Schema.Types.Mixed,
    cards: Schema.Types.Mixed,
    sideShows: Schema.Types.Mixed
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('GameLogs', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    create: function (callback, removeLogs) {
        // console.log("removeLogs.......", removeLogs);
      //  var gameObject = GameLogs();
        // async.waterfall([
        //     function (callback) {
        //         Player.find({}).lean().exec(function (err, data) {
        //             console.log("function 1");
        //             gameObject.players = data;
        //             gameObject.save(callback);
        //         });
        //     },
        //     function (data, callback) {
        //         CommunityCards.find({}).lean().exec(function (err, cards) {
        //             console.log("function 2");
        //             console.log("function 2", data);
        //             data.cards = cards;
        //             data.save(callback);
        //         });
        //     },
        //     function (data, callback) {
        //         SideShow.find({}).lean().exec(function (err, sideShows) {
        //             console.log("function 3");
        //             console.log("function 3", data);
        //             data.sideShows = sideShows;
        //             data.save(callback);
        //         });
        //     }
        // ], callback);
        async.waterfall([
            function (callback) {
                // console.log("removeLogs1",removeLogs);
                removeLogs = removeLogs ? removeLogs : 0;
                // console.log("removeLogs2",removeLogs);
                async.times(removeLogs, function (n, next) {
                    GameLogs.findOne({}).sort({
                        _id: -1
                    }).exec(function (err, data) {
                        console.log("cards deleted");
                        if (!_.isEmpty(data)) {
                            data.remove(next);
                        } else {
                            callback("No Undo Data Found");
                        }
                    });
                }, function (err, data) {
                    callback();
                });
            },
            function (callback) {
                async.parallel({
                    players: function (callback) {
                        Player.find({}).lean().exec(callback);
                    },
                    cards: function (callback) {
                        CommunityCards.find({}).lean().exec(callback);
                    },
                    sideShows: function (callback) {
                        SideShow.find({}).lean().exec(callback);
                    }

                }, function (err, result) {
                  //  var gameObject = new GameLogs(result);
                  GameLogs.saveData(result, callback);
                    //gameObject.save(callback);
                });
            }
        ], function (err, data) {
            callback(err);
        });
    },
    // undo: function (callback) {
    //     async.waterfall([
    //         function (callback) { // Remove last 
    //             GameLogs.findOne({}).sort({
    //                 _id: -1
    //             }).exec(function (err, data) {
    //                 if (!_.isEmpty(data)) {
    //                     data.remove(callback);
    //                 } else {
    //                     callback("No Undo Data Found");
    //                 }
    //             });
    //         },
    //         function (data, callback) { // Open Last Now
    //             GameLogs.findOne({}).sort({
    //                 _id: -1
    //             }).lean().exec(function (err, data) {
    //                 if (err) {
    //                     callback(err);
    //                 } else if (_.isEmpty(data)) {
    //                     callback("Undo Not Possible");
    //                 } else {
    //                     async.parallel({
    //                         players: function (callback) {
    //                             async.concat(data.players, function (player, callback) {
    //                                 Player.findOne({
    //                                     _id: player._id
    //                                 }).exec(function (err, playerObj) {
    //                                     if (err) {
    //                                         callback(err);
    //                                     } else {

    //                                         delete player._id;
    //                                         delete player.__v;
    //                                         playerObj = _.assign(playerObj, player);
    //                                         playerObj.save(callback);
    //                                     }
    //                                 });
    //                             }, callback);
    //                         },
    //                         cards: function (callback) {
    //                             async.concat(data.cards, function (card, callback) {
    //                                 CommunityCards.findOne({
    //                                     _id: card._id
    //                                 }).exec(function (err, commuCardObj) {
    //                                     if (err) {
    //                                         callback(err);
    //                                     } else {
    //                                         delete card._id;
    //                                         delete card.__v;
    //                                         commuCardObj = _.assign(commuCardObj, card);
    //                                         commuCardObj.save(callback);
    //                                     }
    //                                 });
    //                             }, callback);
    //                         },
    //                         sideShows: function (callback) {
    //                            // var Ids = [];
    //                             SideShow.drop(function (err) {
    //                                 async.each(data.sideShows, function (sideShow, callback) {
    //                                     delete sideShow._id;
    //                                     delete sideShow.__v;
    //                                     SideShow.saveData(sideShow, callback);
    //                                 }, callback);
    //                             });
    //                             // async.concat(data.sideShows, function (sideShow, callback) {
    //                             //     SideShow.findOne({
    //                             //         _id: sideShow._id
    //                             //     }).exec(function (err, sideShowObj) {
    //                             //         if (err) {
    //                             //             callback(err);
    //                             //         } else {
    //                             //             Ids.push(sideShow._id);
    //                             //             delete sideShow._id;
    //                             //             delete sideShow.__v;
    //                             //             console.log("Idssssss", sideShow._id);
    //                             //             // if (!_.isEmpty(sideShowObj)) {

    //                             //             sideShowObj = _.assign(sideShowObj, sideShow);
    //                             //             sideShowObj.save(callback);
    //                             //             // } else {
    //                             //             //     console.log(sideShow._id);
    //                             //             //     SideShow.delete({
    //                             //             //         _id: sideShow._id
    //                             //             //     } ).exec(callback);
    //                             //             // }
    //                             //         }
    //                             //     });
    //                             // }, function (err, result) {
    //                             //     SideShow.delete({
    //                             //         _id: {
    //                             //             $nin: Ids
    //                             //         }
    //                             //     }, callback);
    //                             // });
    //                         }
    //                     }, callback);

    //                 }
    //             });
    //         }
    //     ], function (err, data) {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             Player.blastSocket({}, true);
    //             callback(err, data);
    //         }
    //     });
    // },
    undo: function (callback) {
        async.waterfall([
            function (callback) { // Remove last 
                GameLogs.findOne({}).sort({
                    _id: -1
                }).exec(function (err, data) {
                    if (!_.isEmpty(data)) {
                        data.remove(callback);
                    } else {
                        callback("No Undo Data Found");
                    }
                });
            },
            function (data, callback) { // Open Last Now
                GameLogs.findOne({}).sort({
                    _id: -1
                }).lean().exec(function (err, data) {
                    if (err) {
                        callback(err);
                    } else if (_.isEmpty(data)) {
                        callback("Undo Not Possible");
                    } else {
                        async.parallel({
                            players: function (callback) {
                                async.concat(data.players, function (player, callback) {
                                    Player.findOne({
                                        _id: player._id
                                    }).exec(function (err, playerObj) {
                                        if (err) {
                                            callback(err);
                                        } else {

                                            delete player._id;
                                            delete player.__v;
                                            playerObj = _.assign(playerObj, player);
                                            playerObj.save(callback);
                                        }
                                    });
                                }, callback);
                            },
                            cards: function (callback) {
                                async.concat(data.cards, function (card, callback) {
                                    CommunityCards.findOne({
                                        _id: card._id
                                    }).exec(function (err, commuCardObj) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            delete card._id;
                                            delete card.__v;
                                            commuCardObj = _.assign(commuCardObj, card);
                                            commuCardObj.save(callback);
                                        }
                                    });
                                }, callback);
                            },
                            sideShows: function (callback) {
                                // var Ids = [];
                                SideShow.remove({}, function (err) {
                                    async.each(data.sideShows, function (sideShow, callback) {
                                        delete sideShow._id;
                                        delete sideShow.__v;
                                        SideShow.saveData(sideShow, callback);
                                    }, callback);
                                });
                                // async.concat(data.sideShows, function (sideShow, callback) {
                                //     SideShow.findOne({
                                //         _id: sideShow._id
                                //     }).exec(function (err, sideShowObj) {
                                //         if (err) {
                                //             callback(err);
                                //         } else {
                                //             Ids.push(sideShow._id);
                                //             delete sideShow._id;
                                //             delete sideShow.__v;
                                //             console.log("Idssssss", sideShow._id);
                                //             // if (!_.isEmpty(sideShowObj)) {

                                //             sideShowObj = _.assign(sideShowObj, sideShow);
                                //             sideShowObj.save(callback);
                                //             // } else {
                                //             //     console.log(sideShow._id);
                                //             //     SideShow.delete({
                                //             //         _id: sideShow._id
                                //             //     } ).exec(callback);
                                //             // }
                                //         }
                                //     });
                                // }, function (err, result) {
                                //     SideShow.delete({
                                //         _id: {
                                //             $nin: Ids
                                //         }
                                //     }, callback);
                                // });
                            }
                        }, callback);

                    }
                });
            }
        ], function (err, data) {
            if (err) {
                callback(err);
            } else {
                Player.blastSocket({}, true);
                callback(err, data);
            }
        });
    },
    flush: function (callback) {
        GameLogs.collection.drop(callback);
    }
};
module.exports = _.assign(module.exports, exports, model);