const express = require('express');
const { CONF } = require("./config.js")
const compression = require('compression')

module.exports = (app) => {
    app.use(compression())
    app.use(express.static('public'));
    app.use(express.json({limit: CONF.json_limit}));

    /*app.use((req, res, next) => {
        if (req.headers.host.startsWith("www")){
            return res.status(301).redirect(`https://${ req.headers.host.split(".").slice(1).join(".") }${ req.url }`);
        }
        return next();
    });*/
}