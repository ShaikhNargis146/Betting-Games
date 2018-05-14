var schema = new Schema({

    minimumBuyin: {
        type: Number,
        require: true
    },
    tableShow: {
        type: Number
    },

    bootAmt: {
        type: Number,
        default: 0
    },
    blindAmt: {
        type: Number,
        require: true
    },
    chalAmt: {
        type: Number,
        require: true
    },
    maximumNoOfPlayers: {
        type: Number,
        default: 9,
        require: true
    },
    name: {
        type: String,
        require: true,
        unique: true,
        index: true
    },
    image: {
        type: String,
        default: ""
    },
    isOpen: Boolean,
    dealer: Number,
    timeoutTime: Number,
    activePlayer: [{
        type: Schema.Types.ObjectId,
        ref: 'Player'
    }],
    status: {
        type: String,
        enum: [
            'beforeStart',
            'started',
            'winner'
        ],
        default: 'beforeStart'
    },
    type: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    gameType: {
        type: String,
        enum: ["Normal", "Lowest", "2 Cards", "4 Cards", "Joker"],
        default: 'Normal'
    },
    jokerCardValue: {
        type: String,
        default: ""
    },
    password: String,
    creator: Schema.Types.ObjectId

});

schema.plugin(deepPopulate, {
    'activePlayer': {
        select: '_id'
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Table', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "activePlayer", "activePlayer"));
var model = {

    /**
     * @function {function getAllTable}
     * @param  {callback} callback {function with err and response}
     * @return {type} {all table data}
     */
    getAllTable: function (callback) {
        this.find({}).exec(callback);
        Player.blastSocket(data.tableId)
    },


    /**
     * @function {function makePlayerInactive}
     * @param  {type} data     {tableId and player data whom to make inactive}
     * @param  {type} callback {function with err and response}
     * @return {type} {makes player inactive}
     */
    makePlayerInactive: function (data, callback) {
        async.parallel({

            player: function (callback) {
                Player.find({
                    table: data.tableId,
                    //  playerNo: data.playerNo
                }).exec(callback);
            }
        }, function (err, result) {
            if (_.isEmpty(result.player)) {
                callback("Invalide Request");
                return 0;
            }

            var removerPlayer = _.find(result.player, function (p) {
                return (result.player._id + "" == p.player + "");
            });
            // var socketId = result.player.socketId;
            if (!removerPlayer) {
                callback(null);
                return 0;
            }

            if (data.tableLeft) {
                removerPlayer.tableLeft = true;
            } else {
                removerPlayer.tableLeft = false;
            }
            Player.blastSocket(data.tableId)
            removerPlayer.save(callback);
        });
    },


    //for backend table create save
    saveBootAmt: function (data, callback) {
        data.bootAmt = data.blindAmt;
        data.upperLimit = 2 * data.chalAmt;
        Table.saveData(data, function (err, data) {

            if (err) {
                console.log("err in save", err)
                callback(err, null);
            } else {
              //  console.log("data in save", data)
                callback(null, data);
            }
        })
    },

    getGameType: function (gameTypes, gameTypeName, callback) {
        var gameType = {};
        if (!gameTypeName) {
            gameTypeName = 'Normal';
        }

        gameTypeIndex = _.findIndex(gameTypes, function (gt) {
            return gt.name == gameTypeName;
        });

        if (gameTypeIndex >= 0) {
            gameType = gameTypes[gameTypeIndex];
        }else{
            gameTypeIndex = _.findIndex(gameTypes, function (gt) {
                return gt.name == 'Normal';
            }); 
            if(gameTypeIndex >= 0){
                gameType = gameTypes[gameTypeIndex];
            }
        }
        return gameType;
    },

    /**
     * @function {function removePlayer}
     * @param  {type} data     {tableId and player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {removes player from that table}
     */
    removePlayer: function (data, callback) {
        // console.log(data);
        async.parallel({
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },
            player: function (callback) {
                Player.findOne({
                    table: data.tableId,
                    accessToken: data.accessToken,
                    //  playerNo: data.playerNo
                }).exec(callback);
            }
        }, function (err, result) {
            if (err) {
                callback(err);
            } else {

                async.waterfall([
                    //     function (callback) {
                    //     User.loose(result.player, callback);
                    // }, 
                    function (callback) {
                        Transaction.makeLooseTransaction(result.player, function (err) {
                            callback(err);
                        });
                    },
                    function (callback) {
                        result.player.remove(function (err) {
                            callback(err);
                        });
                    },
                    function (callback) {
                        Player.checkForWinner(data.tableId, callback);
                    }
                ], function (err, result) {
                    //console.log("err   ", err);
                    Player.sendToAll(data.tableId, {
                        tableId: data.tableId
                    });
                    Player.blastSocket(data.tableId);
                    callback(err, data);
                });


                //loose
                // if (_.isEmpty(result.player) || _.isEmpty(result.table)) {
                //     callback("Invalide Request");
                //     return 0;
                // }

                // var removerPlayer = _.find(result.player, function (p) {
                //     return (result.player._id + "" == p.player + "");
                // });
                // // var socketId = result.player.socketId;
                // if (!removerPlayer) {
                //     callback(null);
                //     return 0;
                // }

                // var removedIds = _.remove(result.table.activePlayer, function (p) {
                //     //console.log((p + "" == removerPlayer._id + ""));
                //     return (p + "" == removerPlayer._id + "");
                // });

                // console.log("removedIds", removedIds)


                // var player = _.cloneDeep(removerPlayer)
                // var socketId = removerPlayer.socketId;
                // var removeCheck = false;

                // result.table.markModified('activePlayer');
                // //console.log("socketId....", socketId);
                // //console.log("result.table ", String("room" + result.table._id));
                // async.parallel([
                //     function (callback) {
                //         result.table.save(callback);
                //     },
                //     function (callback) {
                //         removerPlayer.remove(callback);
                //         // if (removeCheck) {
                //         //     removerPlayer.remove(callback);
                //         // } else {
                //         //     removerPlayer.tableLeft = true;
                //         //     removerPlayer.isActive = true;
                //         //     // removerPlayer.user = "";
                //         //     removerPlayer.save(function (err, foldPlayer) {
                //         //         if (err) {
                //         //             callback(err);
                //         //         } else {
                //         //             Player.fold({
                //         //                 tableId: data.tableId
                //         //             }, callback);
                //         //         }
                //         //     });
                //         // }
                //     },
                //     // function (callback) {
                //     //     Transaction.tableLostAmount(player, callback);

                //     // }
                //     // function (callback) {
                //     //     sails.sockets.leave(socketId, String("room" + result.table._id), callback);
                //     // }
                // ], function (err, result) {
                //     Player.blastSocket(data.tableId)
                //     // console.log("err", err);
                //     callback(err, result);
                // });


            }
        });
    },


    //tableShow when pot amount matches to tableshow amount

    tableShow: function (data, callback) {
        async.parallel({
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId,
                }).exec(callback);
            },
            pot: function (callback) {
                Pot.findOne({
                    table: data.tableId
                }).exec(callback);
            },
            // player: function (callback) {
            //     Player.find({
            //         table: data.tableId,
            //         isActive: true
            //     }).exec(callback);
            // },
        }, function (err, result) {
            if (err || !result.table || !result.pot) {
                callback(err, null);
            } else {
                //console.log("data in tableshow", data);
                if (result.table.tableShow <= result.pot.totalAmount) {
                    Player.blastSocket(data.tableId);
                    data.accessToken = 'fromSystem';
                    data.tableShow = true;
                    Player.showWinner(data, callback);

                } else {
                  //  console.log("called changeturn---------");
                    if (data.noChangeTurn) {
                        callback(err);
                    } else {
                        Player.changeTurn(data.tableId, callback, data.extra);
                    }
                }
            }
        });
    },
    getPrivateTables: function (data, callback) {

        var pagination = 10;
        var page = 1;
        if (data.page) {
            page = data.page - 1;
        }
       // console.log(data);
        var skipRecords = page * pagination;
        User.requestSend({
            accessToken: data.accessToken
        }, function (err, user) {
            if (err || _.isEmpty(user)) {
                callback(err);
            } else {
                var options = {
                    start: page * pagination,
                    count: pagination
                };
            //     console.log("user ", user);
                Table.find({
                    creator: user._id
                }).page(options, callback);

            }
        });
    },
    //tip money given
    makeTip: function (data, callback) {
        console.log("data in tip", data)
        //var amount = data.amount;
        Player.findOne({
            accessToken: data.accessToken
        }).lean().exec(function (err, player) {
          //  console.log("player", player);
            if (err || !player) {
                callback("Error");
            } else {
                player.amount = data.amount;
                player.tip = true;

                User.loose(player, function (err) {
                    Player.blastSocket(player.table);
                    if (!err) {
                        Player.blastTipSocket({
                            amount: data.amount,
                            playerNo: player.playerNo,
                            tableId: player.table
                        });
                    }
                    callback(err, {
                        amount: data.amount,
                        playerNo: player.playerNo,
                        tableId: player.tableId
                    });
                });
            }
        });
        // console.log("amount", amount)
        // console.log("data in maketip", data)
        // async.parallel({
        //     table: function (callback) {
        //         Table.findOne({
        //             _id: data.tableId
        //         }).exec(callback);
        //     },

        //     player: function (callback) {
        //         Player.findOne({
        //             table: data.tableId,
        //             _id: data.id
        //         }).exec(callback);
        //     },

        // }, function (err, result) {

        //     if (err) {
        //         callback(err)
        //     } else {
        //         result.player.totalAmount -= amount;
        //         Player.saveData(result.player, function (err, data1) {
        //             if (err) {
        //                 callback(err, null);
        //             } else {
        //                 console.log("data in tip", data);

        //                 //call api to add this money to TM//
        //                 User.sendTip(data, callback);
        //                 Player.blastSocket(data.tableId)
        //                 // callback(null, data1);
        //             }
        //         })
        //     }
        // });
    },

    blastSocket: function (tableId, extraData, fromUndo) {
        // console.log(tableId);
        // console.log("inside blastSocket", extraData);
        Player.getAllDetails({
            tableId: tableId
        }, function (err, allData) {
            if (err) {
                // console.log(err);
            } else {
                if (!_.isEmpty(extraData)) {
                    allData.extra = extraData;
                } else {
                    allData.extra = {};
                }
                // console.log("allData.extra", allData.extra);

                _.each(allData.players, function (p) {
                    if (!p.tableLeft) {
                        sails.sockets.broadcast(p.socketId, "Update", {
                            data: allData
                        });
                    }
                });
                _.each(allData.dealer, function (d) {
                    sails.sockets.broadcast(d.socketId, "Update", {
                        data: allData
                    });
                });
            }
        });
    },



    /**
     * @function {function addUserToTable}
     * @param  {type} data     {tableId of table to which player should be added}
     * @param  {callback} callback {function with err and response}
     * @return {type} {adds player to table}
     */
    addUserToTable: function (data, callback) {
        console.log("addUserToTable ", data);
        async.parallel({
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },

            players: function (callback) {
                Player.find({
                    table: data.tableId
                }).exec(callback);
            },

        }, function (err, result) {
            //  console.log("result.... in add user to table", result);
            if (!_.isEmpty(result.table)) {
                var table = result.table;
                var playerIndex = -1;
                //check for max players
                if (result.players.length == table.maximumNoOfPlayers) {
                    callback("Room Not Available");
                    console.log("no sit available");
                    return 0;
                }

                //invalid player data
                if (!data.playerNo) {
                    callback("Invalid data");
                    console.log("invalid data")
                    return 0;
                }

                //already exists


                //position filled
                var positionFilled = _.findIndex(result.players, function (p) {
                    return p.playerNo == data.playerNo;
                });

                if (positionFilled >= 0) {
                    console.log("position already filled")
                    callback("position filled");
                    return 0;
                }

                User.requestSend({
                    accessToken: data.accessToken
                }, function (err, user) {
                    if (err || _.isEmpty(user)) {
                        callback("Player no found");
                        return 0;
                    } else {
                        playerIndex = _.findIndex(result.players, function (p) {
                            return (p.memberId + "" == user._id + "");
                        });

                        if (playerIndex >= 0) {
                            // console.log("Player Already Added");
                            callback("Player Already Added");
                            return 0;
                        }

                        if ((user.creditLimit + user.balanceUp) < result.table.chalAmt * Config.minmumBalanceMultiplier) {
                            callback("Insufficient Balance");
                            return 0;
                        }

                        var player = {};
                        player.table = data.tableId;
                        player.playerNo = data.playerNo;
                        player.socketId = data.socketId;
                        player.balance = user.creditLimit + user.balanceUp;

                        //  player.sitNummber = data.sitNummber;
                        player.memberId = user._id;
                        player.accessToken = user.accessToken;
                        player.image = user.image;
                        player.name = user.username;
                        player.userType = user.userType;
                        if (table.status == 'beforeStart') {
                            player.isActive = true;
                        }
                        // player.minAmount = result.table.blindAmt;
                        // player.maxAmount = result.table.chalAmt;

                        Player.saveData(player, function (err, player) {
                            if (err) {
                                callback(err);
                            } else {
                                Player.find({
                                    table: data.tableId,
                                    isActive: true
                                }).exec(function (err, found) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        if (found.length >= 2 && result.table.status == 'beforeStart') {
                                            Player.serve({
                                                tableId: data.tableId
                                            }, function (err1) {
                                                Player.blastSocket(data.tableId);
                                                callback(err, player);
                                            });
                                        } else {
                                            Player.sendToAll(data.tableId, {
                                                tableId: data.tableId
                                            });
                                            Player.blastSocket(data.tableId);
                                            callback(err, player);
                                        }

                                    }
                                });
                            }
                        });
                    }
                });


            } else {
                console.log("No table selected")
                callback("No table selected")
            }
        });

    },
    createPrivateTable: function (data, callback) {
        console.log("data", data);
        var password = _.random(1000, 9999);
        data.type = 'private';
        data.password = password;
        User.requestSend({
            accessToken: data.accessToken
        }, function (err, User) {
            if (err || _.isEmpty(User)) {
                callback(err);
                return 0;
            } else {
                data.creator = User._id
                data = new Table(data);
                data.save(callback);
            }
        });
    },
    filterPrivateTables: function (data, callback) {
        var search = new RegExp(data.search, "i");
        Table.find({
            "name": {
                $regex: search
            },
            type: "private"
        }, callback);
    },
    getAccessToTable: function (data, callback) {
        Table.findOne({
            _id: data.tableId,
            password: data.password
        }).exec(callback);
    },

    /**
     * @function {function changeStatus}
     * @param  {type} table    {table id}
     * @param  {callback} callback {function with err and response}
     * @return {type} {changes status of that particular table}
     */
    changeStatus: function (table, callback) {
        console.log("in status change");

        Table.findOneAndUpdate({
            _id: table._id
        }, {
            status: table.status
        }).exec(function (err, data) {
            callback(err, data);
           // console.log("after status change", data);
        });
    },



    getPrvStatus: function (curStatus) {
        var status = [
            'beforeStart',
            'serve',
            'Turn',
            'winner'
        ];

        var index = _.findIndex(status, function (s) {
            return s == curStatus
        });

        if (index >= 0) {
            curStatus = status[index - 1];
        }

        return curStatus;

    },




    /**
     * @function {function updateStatus}
     * @param  {ObjectId} tableId  {table id of table whose status is to be changed}
     * @param  {callback} callback {function with err and response}
     * @return {type} {updates table status}
     */
    updateStatus: function (tableId, callback) {
        console.log("updateStatus ", tableId);
        var status = [
            'beforeStart',
            'serve',
            'Turn',
            'winner'
        ];
        Table.findOne({
            _id: tableId
        }).exec(function (err, data) {
            var index = _.findIndex(status, function (s) {
                return s == data.status
            });
            data.currentRoundAmt = [];
            if (index >= 0) {
                data.status = status[index + 1];
            }
            async.parallel([function (callback) {
                data.save(callback);
            }, function (callback) {
                if (status[index + 1] == "winner") {
                    Player.showWinner({
                        tableId: tableId
                    }, callback)
                } else {
                    callback(null);
                }
            }], callback);
        });
    },


    connectSocket: function (table, socketId, player, callback) {
        if (table.activePlayer) {
            table.activePlayer.push(
                player._id
            );
        } else {
            table.activePlayer = [
                player._id
            ];
        }
        async.parallel([

            function (callback) {
                table.save(callback);
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                //  console.log(sails.sockets.rooms());
                // sails.sockets.subscribers(table._id, function(err, socketId){
                //        console.log(socketId);
                // });
                Table.blastAddPlayerSocket(table._id);
                callback(err, player);
            }
        });
    },
    blastAddPlayerSocket: function (tableId, extraData) {
        Player.getAllDetails({
            tableId: tableId
        }, function (err, allData) {
            // if (!fromUndo) {
            //     GameLogs.create(function () {});
            // } else {
            //     allData.undo = true;
            // }
            // if (data && data.newGame) {
            //     allData.newGame = true;
            // }

            if (err) {
                console.log(err);
            } else {
                if (extraData) {
                    allData.extra = extraData;
                } else {
                    allData.extra = {};
                }
                //console.log(allData);
                sails.sockets.blast("seatSelection", {
                    data: allData
                });
                // sails.sockets.broadcast("room" + tableId, "Update", {
                //     data: allData
                // });
            }
        });
    },


    /**
     * @function {function getAllActiveOfTables}
     * @param  {type} data    
     * @param  {type} callback {function with err and response}
     * @return {type} {active players in all table with id}
     */
    getAllActiveOfTables: function (data, callback) {
        var activePlayer = {};
        async.parallel({
            activePlayer: function (callback) {
                Table.find({}, {
                    activePlayer: 1
                }).exec(callback);
            },
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(err, data);
            }
        });
    },


    /**
     * @function {function getAllActive}
     * @param  {type} data     {tableid}
     * @param  {type} callback {function with err and response}
     * @return {type} {activePlayer of particular table}
     */
    // getAllActive: function (data, callback) {
    //     async.parallel({
    //         table: function (callback) {
    //             Table.findOne({
    //                 _id: data.tableId
    //             }).select("activePlayer").exec(callback);
    //         }
    //     }, function (err, data) {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             console.log("data........",data)
    //             console.log("data........",data.table.activePlayer)
    //             callback(null, data.table.activePlayer);
    //         }
    //     });
    // },

    getAllActive: function (data, callback) {
        // console.log("ddddd......",data)
        Table.findOne({
            _id: data.tableId
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else {
                // console.log("data........",data)
                callback(null, data.activePlayer);
            }
        });
    },
    setTimeOut: function (tableId, playerNo) {
        //console.log(tableId, playerNo);
        Table.findOne({
            _id: tableId
        }).exec(function (err, table) {

            setTimeout(function (tableId, playerNo, timeout) {
             //   console.log("tableId>>>>>>>>>>>> ", tableId, "playerNo>>>>>>>>> ", playerNo);
                async.parallel({
                    player: function (callback) {
                        Player.findOne({
                            table: tableId,
                            playerNo: playerNo,

                        }).exec(callback);
                    }

                }, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {

                        if (data && data.player && !moment(data.player.turnTimeStamp).isAfter(moment().subtract(timeout, 'seconds')) && data.player.isTurn) {
                            //    var tableLeft = false;
                            //     if(data.player.autoFoldNo == 1){
                            //         tableLeft = true;  
                            //     }
                            if (!data.player.sideShow) {
                                Player.deletePlayer({
                                    tableId: tableId,
                                    accessToken: data.player.accessToken,
                                    autoFold: true
                                }, function (err) {
                                    sails.sockets.broadcast(data.player.socketId, "removePlayer", {
                                        data: data.player
                                    });
                                    // console.log("function called>>>>>>>");
                                    // Player.update({
                                    //     _id: data.player._id
                                    // }, {
                                    //     $inc: {
                                    //         autoFoldNo: 1
                                    //     },
                                    //     $set: {
                                    //         tableLeft: tableLeft
                                    //     }
                                    // },{new: true}).exec(function (err, data) {
                                    //     console.log("document????????????/????? ", data);
                                    // });
                                });
                            } else {
                                Player.cancelSideShow({
                                    tableId: data.player.table,
                                    accessToken: data.player.accessToken
                                }, function (err) {
                                });
                            }

                        }
                    }
                });

            }, Config.autoFoldDelay * 1000, tableId, playerNo, Config.autoFoldDelay);
        });
    },
    filterTables: function (data, callback) {
        /**
         * Data Format Required data.keyword , data.filter.blindAmt, data.filter.challAmt,      data.filter.type data.page
         */
        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                asc: 'name'
            },
            start: (page - 1) * Config.maxRow,
            count: Config.maxRow
        };


        Table.find(data.filter)
            .order(options)
            .keyword(options)
            .lean()
            .page(options, function (err, data) {
                // console.log("data ", data);
                async.eachLimit(data.results, 15, function (table, callback) {
                 //   console.log("table ", table);
                    Player.count({
                        table: table._id
                    }).exec(function (err, count) {
                        if (err) {
                            callback(err);
                        } else {
                           // console.log("table ", table);
                            table.noOfPlayers = count;
                            callback();
                        }
                    });
                }, function (err) {
                    callback(err, data);
                });
            });
    }
}
module.exports = _.assign(module.exports, exports, model);