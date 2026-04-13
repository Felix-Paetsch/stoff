const express = require('express');
const { CONF } = require("./config.js")
const compression = require('compression')
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth-connect');

module.exports = (app, DATA) => {
    app.use(compression())
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(basicAuth(CONF.auth || 'Auth', CONF.auth_pw || 'BrombeereNotFound'));
    app.use(express.static('public'));
    app.use(express.json({limit: CONF.json_limit}));
}