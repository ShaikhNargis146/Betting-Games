var schema = new Schema({
    fromPlayerNo:Number,
    toPlayerNo:Number,
    winner: Schema.Types.Mixed 
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('SideShow', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {

};
module.exports = _.assign(module.exports, exports, model);