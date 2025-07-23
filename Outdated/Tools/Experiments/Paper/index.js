// require('dotenv').config();
"use strict";

const express = require('express');
const app = express();
const { CONF } = require("./config");
const port = CONF.port;

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.get("/", (req, res) => {
  res.render('index', {
      CONF
  });
});

const server = require('http').createServer(app);
server.listen(port, () => {
  console.log(`App listening at PORT :: ${port}`)
});