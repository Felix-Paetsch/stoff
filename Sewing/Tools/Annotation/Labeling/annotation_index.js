const express = require('express');
const app = express();
const { CONF } = require("./config");
const port = CONF.port;

const server = require('http').createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('view engine', 'ejs');

require("./use_middleware.js")(app);
require("./set_up_routes/register_routes.js")(app);

server.listen(port, () => {
  console.log(`App listening at PORT :: ${port}`)
});