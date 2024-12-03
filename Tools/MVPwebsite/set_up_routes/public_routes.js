const redirect_page_not_found = require('./page_not_found_functionality.js');
const { CONF } = require("../config");

module.exports = async (app) => {
    app.get("/", (req, res) => {
        res.render('dev_frontend', {
            CONF
        })
    });

    app.get("/testing", (req, res) => {
        res.render('testing/index', {
            CONF
        })
    })

    app.get("*", redirect_page_not_found);
    app.post("*", redirect_page_not_found);
};
