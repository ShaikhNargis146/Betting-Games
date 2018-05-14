var schema = new Schema({
    playerNo: {
        type: Number,
        required: true
    },

    image: {
        type: String
    },

    userType: {
        type: String
    },

    name: {
        type: String
    },

    playerId: {
        type: String
    },

    memberId: {
        type: String
    },

    buyInAmt: {
        type: Number,
        default: 0
    },

    chalAmt: {
        type: Number
    },

    sitNummber: {
        type: Number
    },

    loosingAmt: {
        type: Number,
        default: 0
    },

    winningAmt: {
        type: Number,
        default: 0
    },


    bootAmt: {
        type: Number,
        default: 0
    },

    maxBlind: {
        type: Number,
        default: 0
    },

    maxSeen: {
        type: Number,
        default: 0
    },

    isTurn: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isFold: {
        type: Boolean,
        default: false

    },
    isDealer: {
        type: Boolean,
        default: false
    },
    isChaal: {
        type: Boolean,
        default: false
    },

    hasTurnCompleted: {
        type: Boolean,
        default: false
    },

    cards: [String],

    cardsServe: {
        type: Number,
        default: 0
    },

    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    tableLeft: {
        type: Boolean,
        default: false
    },

    isLastBlind: {
        type: Boolean,
        default: false
    },
    isBlind: {
        type: Boolean,
        default: true

    },
    accessToken: {
        type: String,
    },
    hasRaised: {
        type: Boolean,
        default: false
    },

    minAmount: {
        type: Number
    },

    maxAmount: {
        type: Number
    },
    balance: {
        type: Number
    },
    socketId: String,
    nextToFirstSeen: {
        type: Boolean,
        default: false
    },
    turnTimeStamp: {
        type: Date
    },
    blindCount: {
        type: Number,
        default: 0
    },
    sideShow: {
        type: Boolean,
        default: false
    }

});
schema.plugin(deepPopulate, {
    populate: {
        'cards': {
            select: 'name _id'
        },
        'table': {
            select: 'bootAmt'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Player', schema);
var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "cards", "cards", "table", "table"));

var model = {

    /**
     * @function {function addPlayer}
     * @param  {object} data     {playerdata}
     * @param  {callback} callback {function with err and response}
     * @return  {new player data}
     */
    addPlayer: function (data, callback) {
        Player.saveData(data, function (err, data2) {
            // console.log("data..............", data);
            if (err) {
                callback(err, data2);
            } else {
                data3 = data2.toObject();
                delete data3.password;
                callback(err, data3);
            }
        });
    },

    /**
     * @function {function updatePlayer}
     * @param  {object} data     {playerNo,field to be modified}
     * @param  {callback} callback {function with err and response}
     * @return  {updated player data}
     */
    updatePlayer: function (data, callback) {

        var playerData = _.clone(data, true);
        delete playerData.playerNo;
        Player.update({
            "playerNo": data.playerNo
        }, playerData, {
            new: true,
            runValidators: true
        }, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                Player.blastSocket(data.tableId)
                callback(err, doc);
            }
        });
    },

    /**
     * @function {function deletePlayer}
     * @param  {object} data     {data of player to be deleted}
     * @param  {callback} callback {function with err and response}
     */
    deletePlayer: function (data, callback) {
        // console.log("data in delete player", data);
        Player.findOne({
            table: data.tableId,
            accessToken: data.accessToken,
            //  playerNo: data.playerNo
        }).exec(function (err, player) {
            if (err || _.isEmpty(player)) {
                callback(err);
            } else {
                async.waterfall([

                    function (callback) {
                        if (player.isTurn) {
                            Player.fold(data, function (err) {
                                callback(err);
                            });
                        } else {
                            callback();
                        }
                    },
                    function (callback) {
                        if (data.autoFold && player.isBlind) {
                            async.parallel([
                                function (callback) {
                                    User.returnMoney(player, function (err) {
                                        callback(err);
                                    });
                                },
                                function (callback) {
                                    Pot.update({
                                        table: data.tableId
                                    }, {
                                        $inc: {
                                            totalAmount: -player.totalAmount
                                        }
                                    }).exec(callback);
                                }
                            ], function (err) {
                                callback(err);
                            });

                        } else {
                            callback();
                        }
                    },
                    function (callback) {
                        player.remove(function (err) {
                            callback(err);
                        });
                    },
                    function (callback) {
                        // console.log("player  ", player);
                        if (!player.isTurn) {
                            //    console.log("inside checkForWinner>>>>>>>>>>>>>>>>>>");
                            Player.checkForWinner(data.tableId, function (err) {
                                callback(err);
                            });
                        } else {
                            callback();
                        }
                    }
                ], function (err, result) {
                    //console.log("err   ", err);

                    Player.blastSocket(data.tableId);
                    callback(err, result);
                });
            }
        });
    },
    checkForWinner: function (tableId, callback) {
        Player.find({
            table: tableId,
            isActive: true,
            isFold: false
        }).count(function (err, count) {
            if (count == 1) {
                Player.showWinner({
                    tableId: tableId,
                    accessToken: 'fromSystem'
                }, callback);
            } else {
                callback();
            }
        });
    },
    findWinner: function (data, callback) {
        Player.find().exec(function (err, userData) {
            callback(err, userData);
        });
    },


    getAll: function (data, callback) {
        console.log("getAll", data);
        if(!data.tableId){
            callback("Incorrect Request");
            return 0;
        }
        var cards = {};
        var playerNo = -1;
        var accessToken = data.accessToken;

        async.parallel({
            players: function (callback) {
                Player.find({
                    table: data.tableId
                }, {
                    playerNo: 1,
                    table: 1,
                    name: 1,
                    image: 1,
                    userType: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    memberId: 1,
                    _id: 1,
                    isBlind: 1,
                    isChaal: 1,
                    totalAmount: 1,
                    tableLeft: 1,
                    socketId: 1,
                    balance: 1,
                    accessToken: 1

                }).lean().exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var ids = _.map(players, 'memberId');
                        playerNo = _.findIndex(players, function (p) {
                            //console.log("p", p);
                            return p.accessToken == data.accessToken;
                        });

                        _.each(players, function (p) {
                        
                            delete p.accessToken;
                            delete p._id;
                        });
                        
                        if (playerNo >= 0) {
                            playerNo = players[playerNo].playerNo;
                        }

                        User.getBalances(ids, function (err, result) {
                            if (err) {
                                callback(err);
                            } else {
                                //    console.log("result ", result)
                                _.each(players, function (p) {
                                    var memIndex = _.findIndex(result, function (m) {
                                        return m._id + "" == p.memberId + "";
                                    });
                                    if (memIndex >= 0) {
                                        // console.log("playerNo balance", p.playerNo, result[memIndex].balance);
                                        p.balance = result[memIndex].balance;
                                    }
                                });
                                callback(err, players);
                            }
                        });
                    }
                });

            },
            pot: function (callback) {
                Pot.findOne({
                    table: data.tableId
                }).exec(callback);

            },
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).lean().exec(function (err, table) {
                    if (err || !table) {
                        callback(err);
                    } else {
                        table.newGameDelay = Config.newGameDelay;
                        table.autoFoldDelay = Config.autoFoldDelay;
                        callback(err, table);
                    }
                });
            },
            gameType: function (callback) {
                GameType.find({}, callback);
            }
        }, function (err, data) {
            if (err ) {
                console.log("err", err);
                callback(err);
            } else {

                var gameTypeIndex = -1;
                var turnIndex = _.findIndex(data.players, function (p) {
                    return p.isTurn;
                });

                _.uniqBy(data.players, function (n) {
                    return n.playerNo;
                });
                // console.log("data.table", data);
                data.gameType = Table.getGameType(data.gameType, data.table.gameType);

                if (turnIndex >= 0 && !_.isEmpty(data.pot) && !_.isEmpty(data.table)) {
                    data.isChaal = true;
                    if (data.players[turnIndex].isBlind) {
                        data.minAmt = data.pot.maxSeenAmt / 2;
                        data.maxAmt = data.table.blindAmt * 2;
                        if (data.minAmt < data.pot.maxBlindAmt) {
                            data.minAmt = data.pot.maxBlindAmt;
                        }
                    } else {
                        data.minAmt = data.pot.maxSeenAmt;
                        data.maxAmt = data.table.chalAmt * 2;
                        if (data.minAmt < (data.pot.maxBlindAmt * 2)) {
                            data.minAmt = data.pot.maxBlindAmt * 2;
                        }
                    }
                    if ((data.players[turnIndex].balance - data.players[turnIndex].totalAmount) <= data.minAmt) {
                        data.isChaal = false;
                    }
                }

                if (accessToken != 'fromSystem') {
                    Card.updateCards(data.players, playerNo);
                }

                callback(err, data);
            }
        });
    },



    getAllDetails: function (data, callback, newGameCheck = false) {
        var tableId = data.tableId;
        // console.log(data);
        if (!tableId) {
            callback("Invaid Request");
            return 0;
        }
        var requiredData = Player.requiredData();
        async.parallel({
            players: function (callback) {
                var filter = {};
                if (newGameCheck) {
                    filter = {
                        table: tableId,
                        tableLeft: false
                    }
                } else {
                    filter = {
                        table: tableId
                    }
                }
                Player.find(filter, requiredData.player).deepPopulate("user").lean().exec(callback);

            },
            table: function (callback) {
                Table.findOne({
                    _id: tableId
                }, requiredData.table).exec(callback);
            },
            extra: function (callback) { //to have same format required by the frontend
                callback(null, {});
            }
        }, function (err, allData) {
            if (err) {
                callback(err);
            } else {
                _.each(allData.pots, function (p, key) {
                    p['no'] = key + 1;
                });

                if (allData.table.status == 'beforeStart') {
                    _.remove(allData.players, function (p) {
                        return p.tableLeft;
                    });
                }

                _.each(allData.pots, function (p, key) {
                    if (key == 0) {
                        p['name'] = 'Main rsPot'
                    } else {
                        p['name'] = 'Side Pot ' + key;
                    }
                });

                _.each(allData.players, function (p) {
                    allData.players.winPots = [];
                    _.each(allData.pots, function (pot) {
                        var winIndex = -1
                        if (pot.winner && !_.isEmpty(pot.winner)) {
                            winIndex = _.findIndex(pot.winner, function (w) {
                                return w.winner && w.playerNo == p.playerNo;
                            });
                            if (winIndex >= 0) {
                                allData.players.winPots.push(p.no);
                            }
                            _.remove(pot.winner, function (w) {
                                return !pot.winner
                            });
                        }
                    })


                });
                Player.blastSocket(data.tableId)
            }
            //send isckecked and raise amount( from to end)   
        });
    },


    requiredData: function () {
        var data = {};
        data.table = {
            minimumBuyin: 1,
            smallBlind: 1,
            bigBlind: 1,
            name: 1,
            maximumNoOfPlayers: 1,
            status: 1,
            currentRoundAmt: 1,
            timeoutTime: 1
        };
        data.player = {
            playerNo: 1,
            socketId: 1,
            hasRaised: 1,
            buyInAmt: 1,
            hasTurnCompleted: 1,
            isSmallBlind: 1,
            isBigBlind: 1,
            totalAmount: 1,
            hasCalled: 1,
            hasChecked: 1,
            isAllIn: 1,
            cards: 1,
            isDealer: 1,
            isFold: 1,
            isActive: 1,
            isTurn: 1,
            isLastBlind: 1,
            user: 1,
            tableLeft: 1
        };

        data.communityCards = {
            cardNo: 1,
            isBurn: 1,
            cardValue: 1,
            serve: 1
        };

        data.pot = {
            totalAmount: 1,
            players: 1,
            type: 1,
            winner: 1
        };
        return data;
    },

    getTabDetail: function (data, callback) {
        async.parallel({
            playerCards: function (callback) {
                Player.find({
                    playerNo: data.tabId
                }, {
                    playerNo: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    _id: 0
                }).exec(callback);
            }
        }, callback);

    },

    /**
     * @function {function newGame}
     * @param  {callback} callback {function with err and response}
     * @return {type} {flush gamelogs and creates new game}
     */
    newGame: function (data, callback) {
        // console.log("data in new game", data)
        var Model = this;
        async.waterfall([
                // function (callback) {
                //     GameLogs.flush(function (err, data) {
                //         callback(err);
                //     });
                // },
                // function (callback) { // Next Dealer
                //     Model.find({{
                //         table: data.tableId,
                //         isActive: true
                //     }}).exec(function (err, players) {
                //         if (err) {
                //             callback(err);
                //         } else {
                //             console.log("players in new game", players)
                //             var turnIndex = _.findIndex(players, function (n) {
                //                 return n.isDealer;
                //             });
                //             if (turnIndex >= 0) {
                //                 async.parallel({
                //                     removeDealer: function (callback) {
                //                         var player = players[turnIndex];
                //                         player.isDealer = false;
                //                         player.save(callback);
                //                     },
                //                     addDealer: function (callback) {
                //                         var newTurnIndex = (turnIndex + 1) % players.length;
                //                         var player = players[newTurnIndex];
                //                         player.isDealer = true;
                //                         player.save(callback);
                //                     }
                //                 }, function (err, data) {
                //                     callback();
                //                 });
                //             } else {
                //                 callback("No Element Remaining");
                //             }
                //         }
                //     });
                // },

                function (fwCallback) {
                    Model.update({
                        table: data.tableId
                    }, {
                        $set: {
                            isFold: false,
                            cards: [],
                            isTurn: false,
                            isActive: true,
                            isBlind: true,
                            totalAmount: 0,
                            nextToFirstSeen: false,
                            blindCount: 0
                        }
                    }, {
                        multi: true
                    }, function (err, cards) {
                        fwCallback(err);
                    });
                },
                function (callback) {
                    Pot.remove({
                        table: data.tableId
                    }).exec(function (err) {
                        callback(err);
                    });
                },
                function (callback) {
                    Table.update({
                        _id: data.tableId
                    }, {
                        status: 'beforeStart'
                    }).exec(function (err) {
                        Player.blastSocket(data.tableId, {
                            newGame: true
                        });
                        callback(err);
                    });
                },
                function (callback) {
                    async.parallel({
                        players: function (callback) {
                            Player.find({
                                table: data.tableId,
                                isActive: true
                            }).exec(callback);
                        },
                        table: function (callback) {
                            Table.findOne({
                                _id: data.tableId
                            }).exec(callback);
                        }
                    }, function (err, result) {
                        var ids = _.map(result.players, 'memberId');
                        User.getBalances(ids, function (err, users) {
                            if (err) {
                                callback(err);
                            } else {
                                var count = 0;
                                async.each(users, function (u, callback) {
                                    if (u.balance >= result.table.blindAmt) {
                                        count++;
                                        callback();
                                    } else {
                                        var playerIndex = _.findIndex(result.players, function (p) {
                                            return p.memberId + "" == u._id + "";
                                        });
                                        if (playerIndex >= 0) {
                                            result.players[playerIndex].remove(function (err) {
                                                sails.sockets.broadcast(result.players[playerIndex].socketId, "removePlayer", {
                                                    data: result.players[playerIndex]
                                                });
                                                callback(err);
                                            });
                                        } else {
                                            callback();
                                        }
                                    }
                                }, function (err) {
                                    if (count >= 2) {
                                        Player.serve(data, callback);
                                    } else {
                                        Player.blastSocket(data.tableId);
                                        callback(err);
                                    }
                                });

                            }
                        });
                    })
                    // Player.find({
                    //     table: data.tableId,
                    //     isActive: true
                    // }).exec(function (err, players) {
                    //     // console.log("count >>>>>>>>>", count);
                    //     var ids = _.map(players, 'memberId');
                    //     User.getBalances(ids, function (err, result) {
                    //         if (err) {
                    //             callback(err);
                    //         } else {
                    //             var count = 0;
                    //             _.each(result, function (u) {
                    //                 //  if(u.balance >=  ){

                    //                 //  }  
                    //             });
                    //             if (count >= 2) {
                    //                 Player.serve(data, callback);
                    //             } else {
                    //                 callback(err)
                    //             }
                    //         }
                    //     });
                    // });
                }
                // function ( callback) {
                //     SideShow.remove({}, callback);
                // },
                // function (arg1, fwCallback) {
                //     Setting.update({
                //         name: "turnLimit"
                //     }, {
                //         $set: {
                //             value: 1
                //         }
                //     }, {
                //         new: true
                //     }, function (err, CurrentTab) {
                //         fwCallback(err, CurrentTab);
                //     });
                // },
                // function (arg1, fwCallback) {
                //     GameType.update({

                //     }, {
                //         $set: {
                //             jokerCard: ""
                //         }
                //     }, {
                //         new: true,
                //         multi: true
                //     }, function (err, CurrentTab) {
                //         fwCallback(err, CurrentTab);
                //     });
                // }
            ],
            function (err) {

                callback(err);
            });
        // Player.blastSocket(data.tableId)
        // readLastValue = "";
        // cardServed = false;
    },
    /**
     * @function {function makeDealer}
     * @param  {type} data     {player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {creates new dealer}
     */
    makeDealer: function (tableId, callback) {
        var Model = Player;
        Player.find({
            $or: [{
                isActive: true,
                table: tableId
            }, {
                table: tableId,
                isDealer: true
            }]
        }).sort({
            playerNo: 1
        }).exec(function (err, players) {
            if (err) {
                // console.log("in if")
                callback(err, null);
            } else {
                // console.log("in else")
                // console.log("plyrrrrr", players);
                var newDealerIndex = 0;
                var dealerIndex = _.findIndex(players, function (p) {
                    return p.isDealer;
                });
                if (dealerIndex >= 0) {
                    newDealerIndex = (dealerIndex + 1) % players.length;
                }
                //console.log("dealerIndex ", newDealerIndex);
                async.parallel([
                    function (callback) {
                        players[newDealerIndex].isDealer = true;
                        players[newDealerIndex].save(callback);
                    },
                    function (callback) {
                        if (dealerIndex >= 0) {
                            players[dealerIndex].isDealer = false;
                            players[dealerIndex].save(callback);
                        } else {
                            callback(null);
                        }
                    }
                ], callback);
            }
        });

    },


    /**
     * @function {function removeDealer}
     * @param  {type} data     {player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {remove player as a dealer}
     */
    removeDealer: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isDealer: false
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            Player.blastSocket(data.tableId)
            callback(err, CurrentTab);
        });
    },
    removeTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: false
            }
        }, {
            new: true
        }, function (err, currentTab) {
            Player.blastSocket();
            callback(err, currentTab);
        });
    },
    addTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: true
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            Player.blastSocket();
            callback(err, CurrentTab);
        });
    },

    getByPlrId: function (data, callback) {
        Player.findOne({
            _id: data.id
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else if (_.isEmpty(found)) {
                callback(null, "noDataound");
            } else {
                Player.blastSocket(data.tableId)
                callback(null, found);
            }

        });
    },




    /**
     * @function {function checkDealer}
     * @param  {type} tableId  {id of table for which dealer to be checked}
     * @param  {callback} callback {function with err and response}
     * @return {type} {dealer data}
     */
    checkDealer: function (tableId, callback) {
        Player.findOne({
            isActive: true,
            table: tableId,
            isDealer: true
        }).exec(callback);
        Player.blastSocket(data.tableId)
    },




    /**
     * @function {function makeSeen}
     * @param  {object} data     {data of player}
     * @param  {callback} callback {function with err and response}
     * @return {type} {makes player's isBlind false}
     */
    makeSeen: function (data, callback) {
        var Model = this;
        var cond = {};
        if (data.accessToken) {
            cond = {

                table: data.tableId,
                accessToken: data.accessToken
            }
        } else {
            cond = {
                isTurn: true
            }
        }
        async.waterfall([function (callback) {
            Model.findOneAndUpdate(cond, {
                //update: {
                $set: {
                    isBlind: false
                }
                //}
            }, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    Player.blastSocket(data.tableId);
                    callback(null, data.tableId);
                }
            });
        }, Player.setNextToFirstSeen], function (err) {
            Player.blastSocket(data.tableId);
            callback(err);
        });
    },
    checkNextToFirstSeen: function (data, callback) {
        Player.find({
            table: data.table,
            isActive: true,
            isFold: false
            //    playerNo:data.playerNO,
            //    nextToFirstSeen: true
        }).exec(function (err, players) {
            if (err || _.isEmpty(players)) {
                callback(err);
            } else {
                //var playerNo = 0;

                var nextIndex = _.findIndex(players, function (p) {
                    return (p.playerNo == data.playerNo && p.nextToFirstSeen);
                });
                if (nextIndex >= 0) {
                    if (_.size(players) >= 4) {
                        if (players[nextIndex].blindCount == 1) {
                            players[nextIndex].isBlind = false;
                            players[nextIndex].save(callback);
                        } else {
                            players[nextIndex].blindCount++;
                            players[nextIndex].save(callback);
                        }
                    } else if (_.size(players) == 3) {
                        if (players[nextIndex].blindCount == 3) {
                            players[nextIndex].isBlind = false;
                            players[nextIndex].save(callback);
                        } else {
                            players[nextIndex].blindCount++;
                            players[nextIndex].save(callback);
                        }
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
            }
        });
    },
    makeAllSeen: function (tableId, callback) {
        Player.find({
            table: tableId,
            isActive: true,
            isFold: false
        }).exec(function (err, players) {
            if (err) {
                callback(err);
            } else {
                var nextToseenIndex = _.findIndex(players, function (p) {
                    return p.nextToFirstSeen && p.isTurn;
                });
                if (nextToseenIndex >= 0) {
                    players.splice(nextToseenIndex, 1);
                    async.each(players, function (p, callback) {
                        p.isBlind = false;
                        p.save(callback);
                    }, callback);
                } else {
                    callback();
                }
            }
        });
    },
    setNextToFirstSeen: function (tableId, callback) {
        Player.find({
            table: tableId,
            isActive: true,
            isFold: false
        }).sort({
            playerNo: 1
        }).exec(function (err, players) {
            var seens = _.size(_.filter(players, function (p) {
                return !p.isBlind
            }));
            if (seens == 1) {
                var seenIndex = _.findIndex(players, function (p) {
                    return !p.isBlind
                });
                var nextToFirstSeen = (seenIndex + 1) % players.length;
                var nextPlayer = players.splice(nextToFirstSeen, 1);
                nextPlayer[0].nextToFirstSeen = true;
                nextPlayer[0].save(callback);
                // console.log(" nextPlayer ", nextPlayer);
                // console.log(" players ", players);
                // async.parallel(
                //     [
                //         function (callback) {
                //             nextPlayer[0].nextToFirstSeen = true;
                //             nextPlayer[0].save(callback);
                //         },
                //         function (callback) {
                //             async.each(players, function (p, callback) {
                //                 console.log("p>>>>>>>>>> ", p);
                //                 p.isBlind = false;
                //                 p.save(callback);
                //             }, callback);
                //         }
                //     ], callback);


            } else {
                callback();
            }
        });
    },
    blastCancelSideShow: function (tableId, data) {
        Player.find({
            table: tableId,
            // tableLeft: true
        }).exec(function (err, players) {
            Player.sendSocketUpdate({
                players: players
            }, "sideShowCancel", data);
            // _.each(players, function (p) {
            //     sails.sockets.broadcast(p.socketId, "sideShowCancel", {
            //         data: data
            //     });
            // });
        });

    },
    sendToAll: function (data, extra) {
        Player.getAll({
            tableId: data,
            accessToken: 'fromSystem'
        }, function (err, allData) {


            if (err) {
                console.log(err);
            } else {
                if (extra) {
                    allData.extra = extra;
                } else {
                    allData.extra = {};
                }

                sails.sockets.blast("seatSelection", {
                    data: allData
                });


                // console.log("get in blastsockt..........", allData)
            }
        });
    },
    removeSideShowSocket: function (tableId) {
        Player.find({
            table: tableId,
            // tableLeft: true
        }).exec(function (err, players) {

            _.each(players, function (p) {
                sails.sockets.broadcast(p.socketId, "hideSideShow", {

                });
            });

        });
    },
    blastSocket: function (data, extra, fromUndo) {
        // console.log("in blast socket")
        // console.log("data in blastSocket", data);
        Player.getAll({
            tableId: data,
            accessToken: 'fromSystem'
        }, function (err, allData) {
            // if (!fromUndo) {
            //     GameLogs.create(function () {});
            // }

            if (err) {
                console.log(err);
            } else {
                if (extra) {
                    allData.extra = extra;
                } else {
                    allData.extra = {};
                }
                Player.sendSocketUpdate(allData, "Update");
                // var players
                // _.each(allData.players, function (p) {
                //     //  console.log("p.....", p.playerNo, p.socketId);
                //     allData.players = _.cloneDeep(allData.players);
                //     Card.updateCards(allData.players);
                //     sails.sockets.broadcast(p.socketId, "Update", {
                //         data: allData
                //     });

                // });
                // console.log("get in blastsockt..........", allData)
            }
        });
    },
    sendSocketUpdate: function (allData, eventName, diffData) {
        var players = _.cloneDeep(allData.players);
        var dataToBeSend = allData;
        if (diffData) {
            dataToBeSend = diffData;
        }
    //    var playerTurn =  _.findIndex(allData.players, function(p){
    //          return p.isTurn;
    //     });
    //     if(playerTurn >= 0 ){
    //     console.log("playerTurn >>>>>>", allData.players[playerTurn].playerNo, allData.players[playerTurn].name, allData.extra);
    //     }
        _.each(allData.players, function (p) {
            // console.log("p.....", p.playerNo, p.socketId);
            allData.players = _.cloneDeep(players);
            Card.updateCards(diffData, p.playerNo);
            Card.updateCards(allData.players, p.playerNo);
            sails.sockets.broadcast(p.socketId, eventName, {
                data: dataToBeSend
            });
        });
    },
    blastSocketSideShow: function (tableId, data) {
        Player.find({
            table: tableId,
            // tableLeft: true
        }).exec(function (err, players) {
            Player.sendSocketUpdate({
                players: players
            }, "sideShow", data);
            // _.each(players, function (p) {
            //     sails.sockets.broadcast(p.socketId, "sideShow", {
            //         data: data
            //     });
            // });
        });

    },
    cancelSideShow: function (data, callback) {

        async.waterfall([function (callback) {
                Player.findOne({
                    table: data.tableId,
                    //isTurn: true,
                    accessToken: data.accessToken
                }).exec(function (err, player) {
                    if (err || !player) {
                        // console.log("err >>>>>>>>>>>>>>.................", err);
                        callback("No player found.");
                    } else {
                        player.sideShow = false;
                        // console.log("player >>>>>>>>>>>>>>.................", player);
                        player.save(function (err, player) {
                            callback(err, player);
                        });

                    }
                });
            },
            function (player, callback) {
                Player.chaal({
                    accessToken: 'fromSystem',
                    tableId: data.tableId,
                    amount: 0
                }, callback);
            },
            function (player, callback) {
                data.blastSocket = true;
                data.onlyData = true;
                // data.accessToken = 'fromSystem';
                Player.sideShow(data, function (err, result) {
                    Player.blastCancelSideShow(data.tableId, result);
                    callback();
                });
            },
            //  Player.changeTurn
        ], function (err, result) {
            Player.blastSocket(data.tableId)
            callback(err, data);
        });
    },
    blastSocketWinner: function (tableId, data) {
        //   console.log("data blastSocketWinner", data);
        // var newWinner = _.filter(data.winners, function (n) {
        //     return n.winner;
        // });
        // var finalWinner = _.map(newWinner, function (n) {
        //     var obj = {
        //         cards: n.cards,
        //         descr: n.descr,
        //         playerNo: n.playerNo
        //     };
        //     return obj;
        // });
        Player.find({
            table: tableId,

        }).exec(function (err, players) {
            _.each(players, function (p) {
                sails.sockets.broadcast(p.socketId, "showWinner", {
                    data: data
                });
            });
        });

    },
    allIn: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.isAllIn = true;
                player.hasRaised = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
        Player.blastSocket(data.tableId);
    },

    updateSocket: function (data, callback) {
        console.log("updateSocket ", data);
        Player.update({
            accessToken: data.accessToken
        }, {
            $set: {
                socketId: data.socketId
            }
        }).exec(callback);
    },


    showWinner: function (data, callback) {
        // console.log("inside showwinner>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        //    console.log(" winnerDAta    data  >>>>>>>>>>>>>>>", data);
        var tableId = data.tableId;
        async.waterfall([function (callback) {

                var filter = {};
                if (data.accessToken != 'fromSystem') {
                    Player.findOne({
                        accessToken: data.accessToken,
                        table: data.tableId,
                        isActive: true,
                        isTurn: true
                    }).exec(function (err, player) {
                        if (err || _.isEmpty(player)) {
                            console.log("player not found");
                            callback("player not found");
                        } else {
                            Player.chaal({
                                accessToken: 'fromSystem',
                                tableId: data.tableId,
                                noChangeTurn: true,
                                amount: 0
                            }, function (err) {
                                callback(err);
                            });
                        }
                    });
                } else {
                    callback();
                }
            },
            function (callback) {
                Player.update({
                    table: data.tableId
                }, {
                    isTurn: false
                }, {
                    multi: true
                }).exec(function (err) {
                    callback(err);
                });
            },
            function (callback) {
                async.parallel({
                    players: function (callback) {
                        Player.find({
                            table: data.tableId,
                            isActive: true,
                            isFold: false
                        }).lean().exec(callback);
                    },
                    changeStatus: function (callback) {
                        Table.findOne({
                            _id: data.tableId
                        }).exec(function (err, table) {
                            if (err || _.isEmpty(table)) {
                                callback("Error");
                            } else {
                                if (table.status == 'winner') {
                                    callback('Winner Already Declared');
                                } else {
                                    table.status = 'winner';
                                    table.save(callback);
                                }
                            }
                        });
                    },
                    pot: function (callback) {
                        Pot.findOne({
                            table: data.tableId
                        }).exec(callback);
                    }

                }, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {


                        CommunityCards.findWinner(data.players, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                // console.log("data.players ", data.players);
                                Player.blastSocket(tableId);
                                var winners = _.filter(data.players, function (p) {
                                    return p.winner;
                                });
                                // console.log("winners.length ", winners.length, " data.pot.totalAmount  ", data.pot.totalAmount);
                                // console.log(" data.pot.totalAmount / winners.length ", data.pot.totalAmount / winners.length);
                                async.eachSeries(data.players, function (p, callback) {
                                    if (p.winner) {
                                        p.winningAmt = data.pot.totalAmount / winners.length;
                                        p.totalAmount = (data.pot.totalAmount / winners.length);
                                        User.winner(p, callback);
                                    } else {
                                        callback();
                                    }
                                }, function (err) {
                                    var ids = _.map(data.players, 'memberId');

                                    //  console.log(" playerNo ", playerNo, accessToken);
                                    // if (playerNo < 0 || data.accessToken != 'fromSystem') {
                                    //     callback("Invalid Request");
                                    //     return 0;
                                    // }
                                    // if (playerNo >= 0) {
                                    //     playerNo = players[playerNo].playerNo;
                                    // }

                                    User.getBalances(ids, function (err, result) {

                                        if (err) {
                                            Player.blastSocketWinner(tableId, data);
                                            Player.setNewGameTimeOut(tableId);
                                            callback(err);
                                        } else {
                                            //     console.log("result ", result)
                                            _.each(data.players, function (p) {
                                                var memIndex = _.findIndex(result, function (m) {
                                                    return m._id + "" == p.memberId + "";
                                                });
                                                if (memIndex >= 0) {
                                                    //console.log("playerNo balance", p.playerNo, result[memIndex].balance);
                                                    p.balance = result[memIndex].balance;
                                                }
                                            });
                                            Player.blastSocketWinner(tableId, data);
                                            Player.setNewGameTimeOut(tableId);
                                            callback(err);
                                            // callback(err, data.players);
                                        }
                                    });



                                });
                            }
                        });
                    }
                });
            }
        ], callback);

    },


    /**
     * @function {function doSideShow}
     * @param  {callback} callback {function with err and response}
     */
    doSideShow: function (data, callback) {

        async.waterfall([
            function (callback) {
                // Player.findOne({
                //     table: data.tableId,
                //     isTurn: true,
                //     accessToken: data.accessToken
                // }).exec(function (err, player) {
                //     if (err || !player) {
                //         callback("Error or No Turn");
                //     } else {
                //         callback(err, player);
                //     }
                // });
                Player.currentTurn(data.tableId, function (err, player) {
                    if (err) {
                        callback(err);
                    } else {
                        player.sideShow = false;
                        player.save(function (err, player) {
                            callback(err, player)
                        });
                    }

                });
            },
            // function (playerFromTop, callback) {
            //     GameType.find({}).exec(
            //         function (err, data) {
            //             if (err) {
            //                 callback(err);
            //             } else {
            //                 var gameIndex = _.findIndex(data, function (game) {
            //                     return game.currentType
            //                 });
            //                 if (gameIndex >= 0) {
            //                     callback(err, playerFromTop, data[gameIndex]);
            //                 } else {
            //                     var normalGameIndex = _.findIndex(data, function (game) {
            //                         return game.name == 'Normal';
            //                     });
            //                     if (normalGameIndex >= 0) {
            //                         callback(err, playerFromTop, data[normalGameIndex]);
            //                     } else {
            //                         callback();
            //                     }
            //                 }
            //             }
            //         }
            //     );
            // },
            function (playerFromTop, callback) {
                // console.log(" playerFromTop ", playerFromTop);
                Player.find({
                    $or: [{
                        table: data.tableId,
                        isActive: true,
                        isFold: false,
                    }, {
                        table: data.tableId,
                        isTurn: true
                    }]
                }).sort({
                    playerNo: 1
                }).lean().exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            var nextPlayer = (turnIndex - 1) % players.length;
                            if (nextPlayer < 0) {
                                nextPlayer = players.length - 1;
                            }
                            var finalData = [];
                            finalData.push(players[nextPlayer]);
                            finalData.push(players[turnIndex]);
                            CommunityCards.findWinner(finalData, function (err, winnerData) {
                                if (err) {
                                    callback(err);
                                } else {
                                    var looseIndex = _.findIndex(finalData, function (value) {
                                        return (value.winRank == 2);
                                    });

                                    var turnIndex1 = _.findIndex(finalData, function (value) {
                                        return value.isTurn;
                                    });

                                    if (looseIndex >= 0) {
                                        if (looseIndex == turnIndex1) {
                                            console.log("Loose index is equal to turn index", looseIndex, turnIndex1, winnerData);
                                            async.waterfall([
                                                function (callback) {
                                                    Player.chaal({
                                                        accessToken: 'fromSystem',
                                                        tableId: data.tableId,
                                                        noChangeTurn: true,
                                                        amount: 0
                                                    }, function (err) {
                                                        callback(err);
                                                    });
                                                },
                                                function (callback) {
                                                    Player.fold({
                                                        accessToken: 'fromSystem',
                                                        tableId: data.tableId,
                                                    }, callback);
                                                },
                                                // function (callback) {
                                                //     var sideShowData = {};
                                                //     sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                                //     sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                                //     sideShowData.winner = finalData;
                                                //     SideShow.saveData(sideShowData, callback);
                                                // }

                                            ], function (err, result) {
                                                if (err) {
                                                    callback(err);
                                                } else {
                                                    Player.blastSocket(data.tableId);
                                                    callback();
                                                    // GameLogs.create(function () {
                                                    //     Player.blastSocket();
                                                    //     //callback();
                                                    //     return 0;
                                                    // });

                                                }
                                            });

                                        } else {
                                            console.log("inside the condition");
                                            async.waterfall([
                                                    function (callback) {
                                                        Player.changeTurnPrv(data.tableId, function (err) {
                                                            callback(err);
                                                        });
                                                    },
                                                    function (callback) {
                                                        Player.fold({
                                                            accessToken: 'fromSystem',
                                                            tableId: data.tableId
                                                        }, function (err, data) {
                                                            callback(err);
                                                        });
                                                    },
                                                    function (callback) {
                                                        Player.chaal({
                                                            accessToken: 'fromSystem',
                                                            tableId: data.tableId,
                                                            amount: 0
                                                        }, function (err) {
                                                            callback(err);
                                                        });
                                                    }
                                                ],
                                                // function (callback) {
                                                //     Player.fold({
                                                //         tableId: data.tableId,
                                                //         accessToken: 'fromSystem'
                                                //     }, function (err, result) {
                                                //         callback(err, data.tableId);
                                                //     });
                                                // },
                                                //Player.changeTurn,
                                                // function (data, callback) {
                                                //     var sideShowData = {};
                                                //     sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                                //     sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                                //     sideShowData.winner = finalData;
                                                //     console.log(sideShowData);
                                                //     //console.log(callback);
                                                //     SideShow.saveData(sideShowData, function (err, data) {
                                                //         callback(err);
                                                //     });
                                                // }

                                                function (err, result) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        Player.blastSocket(data.tableId);
                                                        callback();
                                                        // GameLogs.create(function () {
                                                        //     console.log("inside the condition.........");
                                                        //     //  Player.blastSocket({},true);
                                                        //     // callback();
                                                        //     return 0;
                                                        // }, 3);
                                                    }
                                                });
                                        }
                                    } else {
                                        sync.parallel([
                                            function (callback) {
                                                Player.changeTurn(data.tableId, callback);
                                            },
                                            // function (callback) {
                                            //     var sideShowData = {};
                                            //     sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                            //     sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                            //     sideShowData.winner = finalData;
                                            //     console.log(sideShowData);
                                            //     SideShow.saveData(sideShowData, callback);
                                            // }

                                        ], function (err, result) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                Player.blastSocket(data.tableId);
                                                callback();
                                                // GameLogs.create(function () {
                                                //     // callback();
                                                //     Player.blastSocket(data.tableId)
                                                //     return 0;
                                                // });

                                            }
                                        });

                                    }
                                }

                            });

                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },

    sideShow: function (data, callback) {
        // console.log("data >>>>>>>>>>>>>>", data);
        var filter = {};
        var sideShow = false;
        if (data.accessToken == 'fromSystem') {
            filter = {
                table: data.tableId,
                isTurn: true,
            };
        } else {
            filter = {
                table: data.tableId,
                isTurn: true,
                accessToken: data.accessToken
            };
            sideShow = true;
            if (data.onlyData) {
                filter = {
                    table: data.tableId,
                    accessToken: data.accessToken
                };
                sideShow = false;
            }
        }
        async.waterfall([
            function (callback) {
                Player.findOne(filter).exec(function (err, player) {

                    if (err || !player) {
                        console.log(err);
                        callback("Error or No Turn");
                    } else {

                        player.sideShow = sideShow;
                        player.save(function (err, player) {

                            callback(err, player);
                        });
                        //callback(err, player);
                    }
                });
            },
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        table: data.tableId,
                        isActive: true,
                        isFold: false,
                    }, {
                        table: data.tableId,
                        isTurn: true
                    }]
                }).sort({
                    playerNo: 1
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        //blastSocketSideShow
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            var nextPlayer = (turnIndex - 1) % players.length;
                            if (nextPlayer < 0) {
                                nextPlayer = players.length - 1;
                            }
                            var finalData = {};
                            finalData.toPlayer = players[nextPlayer];
                            finalData.fromPlayer = players[turnIndex];
                            if (!data.blastSocket) {
                                Player.blastSocketSideShow(data.tableId, finalData);
                            }
                            // console.log("finalData  ", finalData);
                            callback(null, finalData);
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },

    chaal: function (data, callback) {
        console.log("data in chaal", data);
        if (data.accessToken == 'fromSystem') {
            var filter = {
                isTurn: true,
                table: data.tableId
            };
        } else {
            var filter = {
                table: data.tableId,
                isTurn: true,
                accessToken: data.accessToken
            }
        }
        async.parallel({
            player: function (callback) {
                Player.findOne(filter).exec(callback);
            },

            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },
            pot: function (callback) {
                Pot.findOne({
                    table: data.tableId
                }).exec(callback);
            },
            // user: function (callback) {

            // }
        }, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                data.amount = parseInt(data.amount);
                // console.log("data........", data)
                if (!result.player) {
                    callback("No Turn");
                    return 0;
                }
                // if (data.players.isBlind == true) {
                //     console.log("in if");
                //     data.players.totalAmount = data.players.totalAmount - data.tables.blindAmt;
                // } else {
                //     console.log("in else");
                //     data.players.totalAmount = data.players.totalAmount - data.tables.chalAmt;
                // }

                User.requestSend({
                    accessToken: result.player.accessToken
                }, function (err, user) {
                    if (err || !user) {
                        callback('Some Error');
                    } else {
                        if (result.player.isBlind) {
                            if (data.amount > (result.table.blindAmt * 2)) {
                                data.amount = result.table.blindAmt * 2;
                            }
                            if (result.pot.maxBlindAmt < data.amount) {
                                result.pot.maxBlindAmt = data.amount;
                            }
                            if (result.pot.maxBlindAmt > data.amount) {
                                data.amount = result.pot.maxBlindAmt;
                            }
                        } else {
                            if (data.amount > (result.table.chalAmt * 2)) {
                                data.amount = result.table.chalAmt * 2;
                            }
                            if (result.pot.maxSeenAmt < data.amount) {
                                result.pot.maxSeenAmt = data.amount;
                            }
                            if (result.pot.maxSeenAmt > data.amount) {
                                data.amount = result.pot.maxSeenAmt;
                            }

                        }

                        if ((user.balance) < data.amount) {
                            callback("Insufficient Balance");
                            return 0;
                        }
                        //add to total amount of player.
                        result.player.totalAmount += data.amount;
                        result.player.turnTimeStamp = moment();
                        //add to pot 
                        result.pot.totalAmount += data.amount;
                        async.waterfall([function (callback) {
                                User.loose({
                                    amount: data.amount,
                                    accessToken: result.player.accessToken
                                }, function (err) {
                                    callback(err);
                                });
                            },
                            function (callback) {
                                result.pot.save(function (err) {
                                    callback(err);
                                });
                            },
                            function (callback) {
                                result.player.save(function (err) {
                                    callback(err);
                                });
                            },
                            function (callback) {
                                if (result.player.nextToFirstSeen && result.player.blindCount == 1) {
                                    Player.makeAllSeen(data.tableId, function (err) {
                                        callback(err);
                                    });
                                } else {
                                    callback();
                                }
                            },
                            function (callback) {
                               var extra =  {
                                    chaalAmt: data.amount,
                                    playerNo: result.player.playerNo
                                };
                                data.extra = extra;
                                Table.tableShow(data, callback);
                                //callback
                            },
                            // function(callback){
                                
                            // }
                        ], callback);
                    }
                });
                // Player.saveData(result.player, function (err, data1) {
                //     if (err) {
                //         callback(err, null);
                //     } else {
                //         console.log("call changeturn")
                //         Player.changeTurn(callback);

                //     }
                // })
            }
        })
    },

    blindRaise: function (data, callback) {
        console.log("in blind raise")
        async.parallel({
            tables: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },
        }, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                data.tables.blindAmt = 2 * data.tables.blindAmt;
                data.tables.chalAmt = 2 * data.tables.chalAmt;
                Table.saveData(data.tables, function (err, data1) {
                    if (err) {
                        callback(err, null);
                    } else {
                        Player.blastSocket(data.tables[0]._id);
                        callback(null, data1);
                    }
                })
            }
        })
    },



    /**
     * @function {function currentTurn}
     * @param  {callback} callback {function with err and response}
     * @return {type} {player whose isTurn is true}
     */
    currentTurn: function (tableId, callback) {
        Player.findOne({
            table: tableId,
            isTurn: true
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(data)) {
                callback("No Player Has Turn");
            } else {
                // Player.blastSocket(data.tableId)
                // console.log("in current turn")
                callback(null, data);
            }
        });
    },
    changeTurnPrv: function (tableId, callback, makeChaal = false) {
        async.waterfall([
            function (callback) {
                Player.update({
                    table: tableId
                }, {
                    $set: {
                        isChaal: false
                    }
                }, {
                    multi: true
                }).exec(function (err, data) {
                    callback(err, tableId);
                });
            },
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        table: tableId,
                        isActive: true,
                        isFold: false,
                    }, {
                        table: tableId,
                        isTurn: true
                    }]
                }).sort({
                    playerNo: 1
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeTurn: function (callback) {
                                    var player = players[turnIndex];
                                    player.isTurn = false;
                                    if (makeChaal) {
                                        player.isChaal = true;
                                    }
                                    player.save(callback);
                                },
                                addTurn: function (callback) {
                                    var newTurnIndex = (turnIndex - 1) % players.length;
                                    if (newTurnIndex < 0) {
                                        newTurnIndex = players.length - 1;
                                    }
                                    var player = players[newTurnIndex];
                                    player.isTurn = true;
                                    player.save(callback);
                                },
                                turnLimit: function (callback) {
                                    Setting.findOne({
                                        name: "turnLimit"
                                    }).exec(callback);
                                }
                            }, function (err, data1) {
                                callback(err, data1);
                                Player.blastSocket(tableId);

                                // Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], data.turnLimit, function (err) {
                                //     Player.blastSocket(data.tableId);
                                // });

                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);

    },
    changeTurn: function (tableId, callback, extra) {
        // console.log("in changeTurn")
        async.waterfall([
            function (callback) {
                Player.update({
                    table: tableId
                }, {
                    $set: {
                        isChaal: false
                    }
                }, {
                    multi: true
                }).exec(function (err, data) {
                    callback(err, tableId);
                });
            },
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        table: tableId,
                        isActive: true,
                        isFold: false,
                    }, {
                        table: tableId,
                        isTurn: true
                    }]
                }).sort({
                    playerNo: 1
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeTurn: function (callback) {
                                    var player = players[turnIndex];
                                    player.isTurn = false;

                                    player.isChaal = true;

                                    player.save(callback);
                                },
                                addTurn: function (callback) {
                                    var newTurnIndex = (turnIndex + 1) % players.length;
                                    var player = players[newTurnIndex];
                                    player.isTurn = true;
                                    player.turnTimeStamp = moment();
                                    player.save(callback);
                                },
                              
                            }, function (err, data) {


                                if (err) {
                                    callback(err, null)
                                } else {
                                    // console.log("data..", data);
                                    // console.log("send", data.addTurn[0].table);
                                    Player.checkNextToFirstSeen(data.addTurn[0], function (err) {
                                        Player.blastSocket(data.addTurn[0].table, extra);
                                        callback(null, "Chaal Done");
                                    });
                                    Table.setTimeOut(tableId, data.addTurn[0].playerNo);
                                    Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], function (err) {
                                        // Player.blastSocket(data.tableId);
                                    });
                                }
                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            },

        ], function (err, data) {

            if (err) {
                //  console.log("er///")
                callback(err, null)
            } else {
                // console.log("daat///");
                callback(null, data)
            }
        });

    },
    makeTurn: function (tableId, callback) {
        // console.log("in makeTurn");
        var findInitialObj = {};

        // console.log("in waterfall");
        async.waterfall(
            [
                function (callback) {
                    Player.update({
                        table: tableId
                    }, {
                        $set: {
                            isTurn: false
                        }
                    }, {
                        multi: true
                    }, function (err) {
                        callback(err, tableId);
                    });
                },
                Player.findDealerNext,
                function (player, callback) { // Enable turn from the same
                    // console.log("player data in.....", player);
                    player.isTurn = true;
                    player.turnTimeStamp = moment();
                    player.save(function (err, pl) {
                        Table.setTimeOut(player.table, player.playerNo);
                        callback(err);
                    });
                }
            ], callback);
        // }
        //   },


    },


    raise: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.hasRaised = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
        Player.blastSocket(data.tableId)
    },


    /**
     * @function {function fold}
     * @param  {object} data     {data of player whom to fold}
     * @param  {callback} callback {function with err and response}
     * @return {type} {folds that particular player}
     */
    // fold: function (data, callback) {
    //     async.waterfall([
    //         Player.currentTurn,
    //         function (player, callback) {
    //             player.isFold = true;
    //             player.save(function (err, data) {
    //                 callback(err);
    //             });
    //         },
    //         Player.changeTurn
    //     ], callback);

    // },


    fold: function (data, callback) {
        // console.log("inside fold");
        var tableId = data.tableId;
        if (data.accessToken == 'fromSystem') {
            var filter = {
                isTurn: true,
                table: data.tableId
            };
        } else {
            var filter = {
                table: data.tableId,
                isTurn: true,
                accessToken: data.accessToken
            }
        }
        async.waterfall([
            function (callback) {
                Player.findOne(filter).exec(function (err, player) {
                    if (err || !player) {
                        callback("Error or No Turn");
                    } else {
                        callback(err, player);
                    }
                });
                // Player.currentTurn(tableId, callback);
            },
            function (player, callback) {
                //   console.log("player", player);
                player.isFold = true;
                player.turnTimeStamp = moment();
                player.save(function (err, data2) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(err, player);
                    }
                });
            },
            function (player, callback) {
                if (player.nextToFirstSeen && player.blindCount == 1) {
                    Player.setNextToFirstSeen(tableId, function (err) {
                        callback(err, player);
                    });
                } else {
                    callback(null, player);
                }
            },
            // function (data3, callback) {
            //     User.loose(data3, function (err, data) {
            //         if (err) {
            //             callback(err, null)
            //         } else {
            //             console.log("data3", data3);
            //             Player.blastSocket(data3.table);
            //             callback(null, data)
            //         }
            //     });
            // },
            function (player, callback) {
                Transaction.makeLooseTransaction(player, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                Player.changeTurn(tableId, function (err) {
                    callback(err);
                });
            },
            // function (callback) {
            //     Player.checkForWinner(tableId, callback)
            // }

        ], function (err, complete) {
            if (err) {
                //console.log("not completed")
                callback(err, null);
            } else {
                //console.log("completed")
                callback(null, complete);
            }
        });
    },
    whetherToEndTurn: function (fromPlayer, toPlayer, callback) {
        var tableId = fromPlayer.table;
        Player.find({
            $or: [{
                table: tableId,
                isActive: true,
                isFold: false,

            }, {
                table: tableId,
                isDealer: true
            }]
        }).sort({
            playerNo: 1
        }).exec(function (err, allPlayers) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(allPlayers)) {
                callback("No Players found in Whether to end turn");
            } else {


                var removeAllTurn = false;


                var turnIndex = _.findIndex(allPlayers, function (n) {
                    return n.isTurn;
                });

                var dealerIndex = _.findIndex(allPlayers, function (n) {
                    return n.isDealer;
                });

                var isDealerFoldIndex = _.findIndex(allPlayers, function (n) {
                    return (n.isDealer && n.isFold);
                });

                var newTurnIndex = (dealerIndex + 1) % allPlayers.length;

                var totalActive = _.filter(allPlayers, function (n) {
                    return (!n.isFold && n.isActive);
                });

                var blindIndex = _.findIndex(allPlayers, function (n) {
                    return (!n.isFold && n.isBlind);
                });
                if (fromPlayer.playerNo == toPlayer.playerNo) {

                    removeAllTurn = true;
                }
                //    console.log("totalActive", totalActive);
                // only 1 player left
                if (totalActive.length == 1) {
                    removeAllTurn = true;
                }
                if (removeAllTurn) {
                    //Show Winner to be checked
                    Player.update({
                        table: tableId
                    }, {
                        $set: {
                            isTurn: false
                        }
                    }, {
                        multi: true
                    }, function (err) {
                        Player.blastSocket(tableId);
                        Player.showWinner({
                            tableId: tableId,
                            accessToken: 'fromSystem'
                        }, callback);
                    });
                } else {

                    callback();
                    // if (turnLimit.value == 4 && blindIndex >= 0) {
                    //     //console.log(totalBlind.length);
                    //     Player.update({
                    //         isActive: true,
                    //         isFold: false
                    //     }, {
                    //         $set: {
                    //             isBlind: false
                    //         }
                    //     }, {
                    //         multi: true
                    //     }, function (err, data) {
                    //         Player.blastSocket();
                    //         callback(err, data);
                    //     });
                    // }

                    // //console.log("fromPlayer", fromPlayer)
                    // if ((isDealerFoldIndex < 0 && turnIndex == dealerIndex) || (isDealerFoldIndex >= 0 && turnIndex == newTurnIndex && fromPlayer.playerNo != allPlayers[dealerIndex].playerNo)) {

                    //     // if(data.value == 3 && totalBlind && allPlayer.length == totalBlind.length){
                    //     //     removeAllTurn = true;
                    //     // }else{
                    //     if (!_.isEmpty(turnLimit)) {
                    //         // console.log("blind", totalBlind.length);
                    //         // console.log("allplayer", allPlayers.length);
                    //         // console.log("datavalue", data.value);

                    //         //console.log(totalBlind.length);

                    //         turnLimit.value = Number(turnLimit.value) + 1;
                    //         turnLimit.save(function (data) {});

                    //     } else {

                    //         data = {};
                    //         data.name = "turnLimit";
                    //         data.value = 1;
                    //         Setting.saveData(data, function (data) {});
                    //     }
                    //     //  }

                    // }
                }
                //case 2 from Player and To Player is Same

            }
        });
    },

    findLastBlindNext: function (callback) {
        console.log("in findLastBlindNext");
        async.waterfall([
            function (callback) {
                Player.findOne({
                    isLastBlind: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);

    },
    findDealerNext: function (tableId, callback) {
        // console.log("in findDealerNext")
        async.waterfall([
            function (callback) {
                Player.findOne({
                    table: tableId,
                    isDealer: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);
    },
    nextInPlay: function (player, callback) {
        //console.log("in nextInPlay");
        if (player) {
            Player.find({
                table: player.table,
                isActive: true,
                isFold: false
            }).sort({
                playerNo: 1
            }).exec(function (err, players) {
                if (err) {
                    callback(err);
                } else if (_.isEmpty(players)) {
                    callback("No Next In Play");
                } else {
                    var finalPlayer = _.find(players, function (n) {
                        return (n.playerNo > player.playerNo);
                    });
                    if (finalPlayer) {
                        callback(err, finalPlayer);
                    } else {
                        callback(err, players[0]);
                    }
                }
            });
        } else {
            callback("No Player selected for Next");
        }

    },


    deductBootAmount: function (data, callback) {
        async.parallel({
            players: function (callback) {
                Player.find({
                    isActive: true,
                    table: data.tableId
                }).deepPopulate("table").exec(callback);
            },
        }, function (err, response) {
            if (err) {
                // console.log("err", err)
            } else {
                async.each(response.players, function (player, callback) {
                    // console.log("player.....",player);
                    // console.log("bbbbbb.........", player.table);
                    player.totalAmount = player.totalAmount - player.table.bootAmt;
                    player.bootAmt = player.table.bootAmt;
                    player.chalAmt = player.table.chalAmt
                    //     console.log("player.bootAmtPlay", player.bootAmtPlay)
                    Player.saveData(player, function (err, data) {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, data);
                        }
                    })
                }, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        // console.log("in else.....")
                        Player.blastSocket(data.tableId)
                        callback(null, response.players);
                    }
                });

            }
        });
    },



    /**
     * @function {function serve}
     * @param  {type} data     {players and tableId}
     * @param  {callback} callback {function with err and response}
     * @return {type} {serve cards to all players}
     */
    serve: function (data, callback) {
        console.log("data in serve......", data)
        async.parallel({
            players: function (callback) {
                Player.find({
                    isActive: true,
                    table: data.tableId
                }).exec(callback);
            },
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }, callback);
            },
            gameType: function (callback) {
                GameType.find({}, callback);
            }
        }, function (err, response) {
            //console.log("Game started");
            var allCards = [];
            var playerCards = [];
            var playerCount = response.players.length;
            var players = response.players;
            var dealerNo = -1;
            var maxCardsPerPlayer = 3;
            var jokerCard = 0;
            var totalcards = 0;
            var jokerCardValue = "";
            response.gameType = Table.getGameType(response.gameType, response.table.gameType);

            if (response.gameType.name == 'Joker') {
                jokerCard = 1;
            }

            maxCardsPerPlayer = response.gameType.totalCards;
            totalcards = maxCardsPerPlayer * playerCount;

            if (playerCount <= 1) {
                callback("Less Players - No of Players selected are too less");
                console.log("Less Players - No of Players selected are too less");
                return 0;
            }

            var cardArr = [
                "As", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "Ts", "Js", "Qs", "Ks", "Ad", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "Td", "Jd", "Qd", "Kd", "Ac", "2c", "3c", "4c", "5c",
                "6c", "7c", "8c", "9c", "Tc", "Jc", "Qc", "Kc", "Ah", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "Th", "Jh", "Qh", "Kh"
            ];

            cardArr = _.shuffle(_.shuffle(_.shuffle(_.shuffle(cardArr))));
            cardArr = _.sampleSize(cardArr, totalcards + jokerCard);
            if (jokerCard) {
                
                jokerCardValue = _.pullAt(cardArr, [0]);
            }
            cardArr = _.chunk(cardArr, maxCardsPerPlayer);
            async.eachOf(players, function (player, key, callback) {
                player.cards = cardArr[key];
                player.save(callback);

            }, function (err) {

                if (err) {
                    callback(err, null);
                } else {
                    // console.log("served saved");
                    Player.blastSocket(data.tableId, {
                        serve: "served"
                    });

                    async.waterfall([
                        function (callback) {
                            if (jokerCardValue) {
                                response.table.jokerCardValue = jokerCardValue;
                                response.table.save(function (err) {
                                    callback(err);
                                });
                            } else {
                                callback();
                            }
                        },
                        function (callback) {
                            Pot.createPot({
                                table: data.tableId,
                                maxBlindAmt: response.table.blindAmt,
                                maxSeenAmt: response.table.chalAmt
                            }, function (err) {
                                callback(err);
                            });
                        },
                        function (callback) {
                            async.each(players, function (p, callback) {
                                //    console.log(" response.table.blindAmt ", response.table.blindAmt);
                                User.requestSend(p, function (err, user) {
                                    if (err || !user) {
                                        callback(err);
                                    } else {
                                        // console.log("user ", user);
                                        if ((user.creditLimit + user.balanceUp) >= response.table.blindAmt) {
                                            async.parallel([
                                                function (callback) {
                                                    Player.update({
                                                        _id: p._id
                                                    }, {
                                                        $inc: {
                                                            totalAmount: response.table.blindAmt
                                                        }
                                                    }).exec(callback);
                                                },
                                                function (callback) {
                                                    Pot.update({
                                                        table: data.tableId
                                                    }, {
                                                        $inc: {
                                                            totalAmount: response.table.blindAmt
                                                        }
                                                    }).exec(callback);
                                                },
                                                function (callback) {
                                                    User.loose({
                                                        amount: response.table.blindAmt,
                                                        accessToken: p.accessToken
                                                    }, callback);
                                                }
                                            ], callback);
                                        } else {
                                            p.remove(function (err) {
                                                sails.sockets.broadcast(p.socketId, "removePlayer", {
                                                    data: p
                                                });
                                                callback(err);
                                            });
                                        }
                                    }
                                });
                            }, callback);

                        },
                        function (callback) {
                            Player.makeDealer(data.tableId, function (err) {
                                callback(err);
                            });
                        },
                        function (callback) {
                            setTimeout(
                                function () {
                                    Player.makeTurn(data.tableId, function (err) {
                                        callback(err);
                                    })
                                }, 5 * 1000);
                        },
                        function (callback) {
                            Table.update({
                                _id: data.tableId
                            }, {
                                status: 'started'
                            }).exec(function (err) {
                                callback(err);
                            });
                        }
                    ], function (err) {

                        Player.blastSocket(data.tableId);

                        callback(err);
                    });

                    //   callback(null, palyers);
                }
            });
        });
    },
    removePlayerBlast: function (player) {
        Player.find({
            table: player.table
        }).exec(function (err, players) {
            if (err) {
                console.log(err);
            } else {
                _.each(players, function (p) {
                    // console.log("p.....", p.playerNo, p.socketId);
                    sails.sockets.broadcast(p.socketId, "removePlayer", {
                        data: player
                    });

                });
                sails.sockets.broadcast(player.socketId, "removePlayer", {
                    data: player
                });
            }
        });
    },
    blastTipSocket: function (data) {
        Player.find({
            table: data.tableId
        }).exec(function (err, players) {
            if (err) {
                console.log(err);
            } else {
                _.each(players, function (p) {
                    sails.sockets.broadcast(p.socketId, "tip", {
                        data: data
                    });
                });

            }
        });
    },
    setNewGameTimeOut: function (tableId) {
        console.log("newgame timer");
        setTimeout(function (tableId) {
            Player.newGame({
                tableId: tableId
            }, function () {});
        }, Config.newGameDelay * 1000, tableId);
    },

};
module.exports = _.assign(module.exports, exports, model);