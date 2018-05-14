var schema = new Schema({
    name: {
        type: String,
    },
    value: String,
    visible:Boolean
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Setting', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    store: function (data, callback) {
        var Model = Setting;
        async.each(data, function (singleSetting, callback) {
            Model.findOne({
                _id: singleSetting._id
            }).exec(function (err, single) {
                if (err) {
                    callback(err);
                } else if (!data) {
                    callback("Id not found in Settings");
                } else {
                    single.value = singleSetting.value;
                    single.save(callback);
                }
            });
        });
    }
};
module.exports = _.assign(module.exports, exports, model);