module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    createCards: function (req, res) {
        CommunityCards.createCards(res.callback);
    },
    removeCards: function (req, res) {
        CommunityCards.removeCards(req.body, res.callback);
    },
    findWinner: function (req, res) {
        Player.findWinner(req.body, res.callback);
    },
};
module.exports = _.assign(module.exports, controller);