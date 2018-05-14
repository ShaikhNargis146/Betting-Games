module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    makeCurrentType: function(req, res){
        GameType.makeCurrentType(req.body, res.callback);
    }
};
module.exports = _.assign(module.exports, controller);
