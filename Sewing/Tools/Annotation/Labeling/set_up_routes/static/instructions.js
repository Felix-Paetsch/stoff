const { CONF } = require('../../config.js');

module.exports = (app) => {
    app.get(`/help`, (req, res) => {
        res.render("static/help.ejs", {
            CONF
        });
    });
}