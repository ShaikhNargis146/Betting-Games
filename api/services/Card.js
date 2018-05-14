var schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    value: [{
        type: String,
        required: true,
        index: true
    }]
});
schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Card', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    getCard: function (value, callback) {
        Card.findOne({
            value: value
        }, {
            name: 1,
            _id: 0
        }).exec(callback);
    },
    findCard: function (callback) {
        // console.log(currentCardId);
        if (currentCardId) {
            Card.count({
                value: currentCardId
            }).exec(function (err, data) {
                callback(err, {
                    count: data,
                    cardId: currentCardId,
                    cardValue: currentCardValue
                });
            });
        } else {
            callback("No Value found in the Card");
        }
    },
    saveLastCard: function (data, callback) {
        Card.findOne({
            name: data.name
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(data)) {
                callback("No such Card Found in saveLastCard");
            } else {
                data.value.push(currentCardId);
                data.value = _.uniq(data.value);
                data.save(callback);
            }
        });
    },
    replaceCard: function (data, callback) {
        async.waterfall([
            function (callback) { // find and Remove Card
                Card.findOne({
                    value: currentCardId
                }).exec(function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_.isEmpty(data)) {
                            callback();
                        } else {
                            data.value = _.filter(data.value, function (n) {
                                return n != currentCardId;
                            });
                            data.save(function () {
                                callback();
                            });
                        }

                    }
                });
            },
            function (callback) { // find other remove card
                Card.saveLastCard({
                    name: data.name
                }, callback);
            }
        ], callback);

    },
    updateCards: function (players, playerNo) {
        _.each(players, function (p) {
            if (p.playerNo != playerNo && _.size(p.cards)) {
                p.cards = ["", "", ""];
            }
            if (p.playerNo == playerNo) {
                if (p.isBlind && _.size(p.cards)) {
                    p.cards = ["", "", ""];
                }
            }
        });
    }
};
module.exports = _.assign(module.exports, exports, model);