module.exports = function check(req, res, next) {
    next({
        name: "Json"
    });
};