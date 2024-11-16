const { Pool } = require('pg');
const { CONF } = require("./config.js");

const client_conf = {
    user: CONF.pg_user,
    host: CONF.pg_host,
    password: CONF.pg_password,
    port: CONF.pg_port,
    database: CONF.pg_database
}

if (CONF.pg_ssl){
    client_conf.ssl = {
        rejectUnauthorized: false
    }
}

const pool = new Pool(client_conf);
module.exports = {
    make_query: (query, args = []) => {
        return new Promise((resolve, reject) => {
            pool.query(query, args, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    },
    end_connection: () => {
      pool.end();
    }
}