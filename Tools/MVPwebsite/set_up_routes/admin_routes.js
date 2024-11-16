const { CONF } = require('../config.js');

const admin_key = CONF.admin_key;
const pw = CONF.admin_pw;

module.exports = (app) => {
    app.use(
        (req, res, next) => {
            if (req.path.startsWith("/" + admin_key) && CONF.require_password){
                if (req.body.pw == pw){
                    return next();
                }

                res.status(403).redirect("/forbidden")
            } else {
                return next();
            }
        }
    );
}