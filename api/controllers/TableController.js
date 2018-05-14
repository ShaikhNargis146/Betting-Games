module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    addUserToTable: function (req, res) {
        Table.addUserToTable(req.body, res.callback);
    },
    getAllTable: function (res) {
        Table.getAllTable(res.callback);
    },
    removePlayer: function (req, res) {
        Table.removePlayer(req.body, res.callback);
    },
    makePlayerInactive: function (req, res) {
        console.log("inside makePlayerInactive", req.body);
        Table.makePlayerInactive(req.body, res.callback);
    },


    saveBootAmt: function (req, res) {
        Table.saveBootAmt(req.body, res.callback);
    },


    tableShow: function (req, res) {
        Table.tableShow(req.body, res.callback);
    },

    changeStatus: function (req, res) {
        Table.changeStatus(req.body, res.callback);
    },
    connectSocket: function (req, res) {
        Table.connectSocket(req.body, res.callback);
    },

    makeTip: function (req, res) {
        Table.makeTip(req.body, res.callback);
    },

    blastAddPlayerSocket: function (req, res) {
        Table.connectSocket(req.body, res.callback);
    },

    getAllActive: function (req, res) {
        Table.getAllActive(req.body, res.callback);
    },

    getAllActiveOfTables: function (req, res) {
        Table.getAllActiveOfTables(req.body, res.callback);
    },
    createPrivateTable: function (req, res) {
        Table.createPrivateTable(req.body, res.callback);
    },
    getPrivateTables: function (req, res) {
        Table.getPrivateTables(req.body, res.callback);
    },
    getAccessToTable: function (req, res) {
        Table.getAccessToTable(req.body, res.callback);
    },
    filterTables: function (req, res) {
        if (req.body) {
            Table.filterTables(req.body, res.callback);
        } else {
            res.callback("Incorrect Format");
        }
    }
};
module.exports = _.assign(module.exports, controller);