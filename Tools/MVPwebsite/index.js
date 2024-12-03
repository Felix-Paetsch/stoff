// require('dotenv').config();
"use strict";

const express = require('express');
const app = express();
const { CONF } = require("./config");
const port = CONF.port;

let server;
if (CONF.use_https){
  const fs = require('fs');
  const options = {
    key:  fs.readFileSync(CONF.private_key_path),
    cert: fs.readFileSync(CONF.cert_path)
  };
  server = require('https').createServer(options,app);
} else {
  server = require('http').createServer(app);
}

app.set('view engine', 'ejs');

(async () => {
  require("./use_middleware.js")(app);
  
  require("./set_up_routes/admin_routes.js")(app);
  require("./set_up_routes/editing_routes.js")(app);
  require("./set_up_routes/public_routes.js")(app);
  

  server.listen(port, () => {
    console.log(`App listening at PORT :: ${port}`)
  });

  if (CONF.use_https){
    require("./init_redirection_server.js")()
  }
})()