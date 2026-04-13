const path = require('path');
const try_respond = require('../try_respond.js');

module.exports = (app) => {
    app.get(`/reroute_files/*`, async (req, res) => {
        try_respond(req, res, async (req, res) => {
            const requestedPath = req.params[0];
            if (requestedPath.includes('..') || !requestedPath.startsWith('data')) {
                return res.status(400).send('Invalid file path.');
            }
            const filePath = path.join(__dirname, '../../', requestedPath);
            res.sendFile(filePath);
        });
    });
}
