module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    createCards: function (req, res) {
        Card.createCards(res.callback);
    },
    findCard: function (req, res) {
        Card.findCard(res.callback);
    },
    saveCard: function (req, res) {
        async.waterfall([
            Card.findCard,
            function (data, callback) { //saving the values to the database
                if (data.count === 0) {
                    Card.saveLastCard(req.body, callback);
                } else {
                    callback("Error Value already Mapped");
                }
            }
        ], res.callback);
    },
    replaceCard: function (req, res) {
        Card.replaceCard(req.body, res.callback);
    }
};
module.exports = _.assign(module.exports, controller);