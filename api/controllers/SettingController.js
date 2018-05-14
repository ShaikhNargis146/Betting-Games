module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    store: function (req, res) {
        Setting.store(req.body, res.callback);
    }
};
module.exports = _.assign(module.exports, controller);