module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    getPlayerTransaction: function(req, res){
          Transaction.getPlayerTransaction(req.body, res.callback);
    }
};
module.exports = _.assign(module.exports, controller);
