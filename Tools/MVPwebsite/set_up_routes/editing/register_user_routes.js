const { CONF } = require('../../config.js');
const { make_query } = require('../../db_connection.js');

module.exports = (app) => {
    app.get(`/${ CONF.editing_key }`, (req, res) => {
        res.render('editing/index', {
            CONF
        });
    });

    app.get(`/${ CONF.editing_key }/edit_pattern`, (req, res) => {
        res.render('editing/edit_pattern', {
            CONF
        });
    });

    app.get(`/folder`, (req, res) => {
        res.render('folderstructure/index', {
            CONF
        });
    });
}