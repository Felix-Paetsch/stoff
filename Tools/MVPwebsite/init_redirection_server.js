module.exports = () => {
    const express = require('express');
    const { CONF } = require("./config");
    const app = express();

    app.all("*", (req, res) => {
        return res.status(301).redirect(`https://${ req.headers.host }${ req.url }`);
    });

    require('http').createServer(app).listen(CONF.http_redirect_port, () => {
        console.log(`HTTP redictect listening at PORT :: ${CONF.http_redirect_port}`)
    });
}