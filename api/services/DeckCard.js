var schema = new Schema({
    cards: [{
        type: Schema.Types.ObjectId,
        ref: 'Card'
    }]
});

schema.plugin(deepPopulate, {
    populate: {
        'cards': {
            select: 'name _id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('DeckCard', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema,'cards','cards'));
var model = {};
module.exports = _.assign(module.exports, exports, model);