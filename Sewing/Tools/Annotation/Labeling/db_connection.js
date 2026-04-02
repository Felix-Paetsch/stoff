const { Pool } = require('pg');
const { DB_CONF } = require("./config.js");

const client_conf = {
    user: DB_CONF.pg_user,
    host: DB_CONF.pg_host,
    password: DB_CONF.pg_password,
    port: DB_CONF.pg_port,
    database: DB_CONF.pg_database
}

if (DB_CONF.pg_ssl){
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