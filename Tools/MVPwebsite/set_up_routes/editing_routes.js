const { CONF } = require('../config.js');

module.exports = (app) => {
    require('./editing/register_user_routes')(app);
}