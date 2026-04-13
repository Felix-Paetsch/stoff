const try_respond = require('../try_respond.js');

module.exports = (app) => {
    app.get(`/successfully_logged_out`, (req, res) => {
        try_respond(req, res, async(req, res) => {
            res.render("misc/logged_out.ejs");
        });
    });
}