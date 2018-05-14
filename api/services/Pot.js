var schema = new Schema({
    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },
    totalAmount: {
        type: Number,
        default: 0
    },

    winner: {
        type: Schema.Types.Mixed,
    },
    maxBlindAmt: {
        type: Number,
        default: 0
    },
    maxSeenAmt: {
        type: Number,
        default: 0
    }

});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Pot', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {


    /**
     * @function {function createPot}
     * @param  {object} data     {palyer data, table data, pot amount}
     * @param  {callback} callback {tableId of table to which player should be added}
     * @return {type} {creates new pot for each game}
     */
    createPot: function (data, callback) {
        console.log("in pot create");
        var Model = this;
        Model.saveData(data, callback);
       // Player.blastSocket(data.tableId)
        // console.log("data after SaveData", data)
    },
    getMainPot: function (tableId, callback) {
        Pot.findOne({
            table: tableId,
            type: 'main'
        }).exec(callback);
    },
    addCurrentRoundAmt: function (data, callback) {
        Table.findOne({
            _id: data.tableId
        }).exec(function (err, table) {
            if (table.currentRoundAmt) {
                var player = _.findIndex(table.currentRoundAmt, function (c) {
                    return data.playerNo == c.playerNo
                });
                if (player >= 0) {
                    table.currentRoundAmt[player]["amount"] += data.amount;
                } else {
                    table.currentRoundAmt.push(data);
                }
            } else {
                table.currentRoundAmt = [data];
            }
            table.save(function (err, data) {
                // console.log(err);
                callback(err, data);
            });
        });
    },
    declareWinner: function (allData, callback) {
        async.concat(allData.pots, function (p, callback) {
            var players = _.uniqBy(p.players, "playerNo");
            // console.log("players", players);
            var playerNos = _.map(players, "playerNo");
            // console.log("playerNos ", playerNos);
            // remove players not in pot and fold
            var playerData = _.filter(allData.players, function (p) {
                //  console.log("p.playerNo", p.playerNo, _.indexOf(playerNos, p.playerNo));
                if (_.indexOf(playerNos, p.playerNo) == -1) {
                    return false;
                } else {
                    return true;
                };
            });
            // console.log("playerData ", playerData);
            var potPlayers = _.cloneDeep(playerData);

        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                //console.log("concat data", data);
                allData.pots = data;
                Transaction.makePotTransaction(allData, callback);
            }
        });
    },


    getAmountForPlayer: function (potsInfo, playerNo, round) {
        var paidAmt = 0;
        //console.log("potsInfo", potsInfo);
        //console.log("playerNo", playerNo);
        //console.log("round", round);
        _.each(potsInfo, function (pot) {
            var playerAmt = _.find(pot.players, function (p) {
                return (playerNo == p.playerNo);
            });

            //console.log("getAmountForPlayer playerAmt", playerAmt);

            if (playerAmt) {
                paidAmt += playerAmt.amount;
            }
        });
        //console.log("paidAmt", paidAmt);
        return paidAmt;
    },

    //amountTobeAdded
    addAmountToPot: function (data, callback) {
        // console.log("data in addmount", data);
        var potAmt = data.sendAmount;
        // console.log("potAmt",potAmt);
        Pot.findOne({
            table: data.tableId
        }).exec(function (err, data) {
            if (err) {
                console.log("err", err);
                callback(err, null);
            } else {
                // console.log("ddd", data);
                var pot = data;
                // console.log("pot",pot);
                pot.totalAmount = potAmt;
                Pot.saveData(pot, function (err, data) {
                    if (err) {
                        callback(err, null);
                    } else {
                        Player.blastSocket(data.tableId)
                        callback(null, data);
                    }
                })
            }
        });
    },



    //amountTobeAdded
    addAmtToPot: function (data, callback) {
        var pots = data.pots;
        var amountTobeAdded = data.amountTobeAdded;
        // console.log("amountTobeAdded", amountTobeAdded);
        async.eachOfSeries(pots, function (item, key, callback) {
            var player = {};
            var deductAmt = 0;
            var payAmt = item.payableAmt;
            // console.log("payableAmt ", item, key);
            ///////////////////////////////////
            // handle if someone has done allIn before with lesser amount
            //   amountTobeAdded = amountTobeAdded - payAmt;
            var allInPlayerAmt = [];
            var players = [];
            var paidAllInAmt = 0;
            var minAllInAmt = 0;
            var allInPlayer = _.filter(data.players, function (p) {
                return p.isActive && !p.isFold && p.isAllIn && p.playerNo != data.currentPlayer.playerNo
            });
            // console.log("allInPlayer...........", allInPlayer);
            _.each(allInPlayer, function (ap) {
                paidAllInAmt = 0;
                players = _.filter(item.players, function (p) {
                    return (p.playerNo == ap.playerNo);
                });

                paidAllInAmt = _.sumBy(players, 'amount');
                allInPlayerAmt.push(paidAllInAmt)
            });

            var minAllInAmt = _.min(allInPlayerAmt);





            /////////////////////////////////
            //add all the remaining money if is greater than payable money

            if (key == (pots.length - 1) && amountTobeAdded > payAmt) {
                // console.log("(pots.length - 1) ", (pots.length - 1), "key ", key);
                payAmt = amountTobeAdded;
            }

            if (amountTobeAdded == 0 || payAmt == 0) {
                callback(null);
            } else {
                // player = _.find(item.players, function (p) {
                //     return data.currentPlayer.playerNo = p.playerNo && p.round == data.tableStatus;
                // });

                // if (player) {
                //     deductAmt = player.amount;
                // }
                // payAmt = item.potMaxLimit - deductAmt; //substract already paid amount
                //case 1 , when amount to be added is less than pot max limit
                if (payAmt > amountTobeAdded) {
                    console.log("case 1 , when amount to be added is less than pot max limit");
                    console.log("splitPot");
                    var splitPotAmount = amountTobeAdded + item.paidAmtPerPot;
                    console.log("splitPotAmount", splitPotAmount);
                    Pot.splitPot(item, data.tableStatus, data.currentPlayer, splitPotAmount, function (err, data1) {
                        var sendData = {
                            playerNo: data.currentPlayer.playerNo,
                            amount: amountTobeAdded,
                            round: data.tableStatus,
                            potId: item._id
                        }
                        //add remaing money to existing pot
                        Pot.makeEntryAddAmount(sendData, data.currentPlayer, callback);
                        amountTobeAdded = 0;
                    });
                } else if (minAllInAmt && minAllInAmt < payAmt) {
                    console.log("case 2 when amount to be addded is greater than allIn added amount  ");
                    //case 2 when amount to be addded is greater than allIn added amount  
                    var splitPotAmount = minAllInAmt;
                    var AddToExistsPot = minAllInAmt - item.paidAmtPerPot;
                    amountTobeAdded = amountTobeAdded - minAllInAmt + item.paidAmtPerPot;
                    Pot.splitPot(item, data.tableStatus, data.currentPlayer, splitPotAmount, function (err, newPot) {
                        if (err) {
                            callback(err);
                        } else {

                            async.waterfall([function (callback) {
                                var sendData = {
                                    playerNo: data.currentPlayer.playerNo,
                                    amount: amountTobeAdded,
                                    round: data.tableStatus,
                                    potId: newPot._id
                                }
                                Pot.makeEntryAddAmount(sendData, data.currentPlayer, function () {
                                    callback(err);
                                });
                            }, function (callback) {
                                var sendData = {
                                    playerNo: data.currentPlayer.playerNo,
                                    amount: AddToExistsPot,
                                    round: data.tableStatus,
                                    potId: item._id
                                }
                                Pot.makeEntryAddAmount(sendData, data.currentPlayer, callback);
                            }], callback);

                        }
                    });

                } else {
                    //case 3 when amount to be added is equal to max pot limit
                    console.log("case 3 when amount to be added is equal to max pot limit");
                    amountTobeAdded = amountTobeAdded - payAmt;
                    var sendData = {};
                    sendData.amount = payAmt;
                    sendData.round = data.tableStatus;
                    sendData.potId = item._id;
                    sendData.playerNo = data.currentPlayer.playerNo;
                    Pot.makeEntryAddAmount(sendData, data.currentPlayer, callback);
                }
            }
        }, callback);
    },

    //params: playerNo, amount, round, PotId
    makeEntryAddAmount: function (data, currentPlayer, callback) {
        // console.log(data);
        //console.log("makeEntryAddAmount");
        playerIndex = -1;
        Pot.findOne({
            _id: data.potId
        }).exec(function (err, Pot) {
            if (err) {
                callback(err);
                return 0;
            }
            if (Pot.players) {
                var playerIndex = _.findIndex(Pot.players, function (p) {
                    return (p.playerNo == data.playerNo);
                });
            }
            if (playerIndex >= 0) {
                Pot.players[playerIndex].amount = parseInt(Pot.players[playerIndex].amount) + parseInt(data.amount);
                //Pot.players[playerIndex].round = data.round;
                Pot.totalAmount = parseInt(Pot.totalAmount) + parseInt(data.amount);
            } else {
                var player = {};
                player.amount = data.amount;
                // player.round = data.round;
                player.playerNo = data.playerNo;
                Pot.players.push(player);
                // console.log("...........player",player);
                Pot.totalAmount = parseInt(Pot.totalAmount) + parseInt(data.amount);
            }
            async.parallel([function (callback) {
                Pot.save(callback);
            }, function (callback) {
                currentPlayer.totalAmount += parseInt(data.amount);
                currentPlayer.save(callback);
            }], callback)
        });
    },
    makeEntryRemoveAmount: function (data, currentPlayer, callback) {
        //console.log("makeEntryRemoveAmount");
        playerIndex = -1;
        Pot.findOne({
            _id: data.potId
        }).exec(function (err, Pot) {
            if (err) {
                callback(err);
                return 0;
            }
            if (Pot.players) {
                var playerIndex = _.findIndex(Pot.players, function (p) {
                    return (p.playerNo == data.playerNo);
                });
            }
            if (playerIndex >= 0) {
                Pot.players[playerIndex].amount = parseInt(Pot.players[playerIndex].amount) - parseInt(data.amount);
                // Pot.players[playerIndex].round = data.round;
                Pot.totalAmount = parseInt(Pot.totalAmount) - parseInt(data.amount);
            } else {
                var player = {};
                player.amount = data.amount;
                // player.round = data.round;
                player.playerNo = data.playerNo;
                Pot.players.push(player);
                // console.log("...........player",player);
                Pot.totalAmount = parseInt(Pot.totalAmount) - parseInt(data.amount);
            }
            async.parallel([function (callback) {
                Pot.save(callback);
            }, function (callback) {
                currentPlayer.totalAmount -= parseInt(data.amount);
                currentPlayer.save(callback);
            }], callback);
        });
    }
};
module.exports = _.assign(module.exports, exports, model);