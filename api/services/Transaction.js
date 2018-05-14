var schema = new Schema({
    memberId: Schema.Types.ObjectId,
    amount: Number,
    type: {
        type: String,
        enum: ['win', 'loose']
    },
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Transaction', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
        getPlayerTransaction: function (data, callback) {
            User.requestSend({
                accessToken: data.accessToken
            }, function (err, user) {
                if (err || _.isEmpty(user)) {
                    callback("Player no found");
                    return 0;
                } else {
                    var pagination = 10;
                    var page = 1;
                    if (data.page) {
                        page = data.page - 1;
                    }
                    console.log(data);
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
                            console.log("user ", user);
                            Transaction.find({
                                memberId: user._id
                            }).sort({
                                _id: -1
                            }).page(options, callback);

                        }
                    });
                    // Transaction.find({
                    //     memberId: user._id
                    // }).exec(callback);
                }
            });
        },
        makeLooseTransaction: function (player, callback) {
            var transaction = {
                memberId: player.memberId,
                amount: player.totalAmount,
                type: 'loose'
            };

            var transaction = new Transaction(transaction);
            transaction.save(callback);

        }
    }
        module.exports = _.assign(module.exports, exports, model);