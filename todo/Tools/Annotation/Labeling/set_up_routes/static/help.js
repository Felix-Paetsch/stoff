const { CONF } = require('../../config.js');

module.exports = (app) => {
    app.get(`/:pid/keypoint_help`, (req, res) => {
        res.render("static/keypoint_help.ejs", {
            CONF
        });
    });
}