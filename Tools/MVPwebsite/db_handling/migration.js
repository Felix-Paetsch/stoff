const fs = require('fs');
const { DB_CONF } = require("../config.js");

const client_conf = {
    user: DB_CONF.pg_user,
    host: DB_CONF.pg_host,
    password: DB_CONF.pg_password,
    port: DB_CONF.pg_port,
    database: DB_CONF.pg_main_database
}

if (DB_CONF.pg_ssl){
    client_conf.ssl = {
        rejectUnauthorized: false
    }
}

run_table_init_queries();

async function run_table_init_queries(){
    const { make_query, end_connection } = require('../db_connection.js');

    await make_query(fs.readFileSync("db/migrations.sql", encoding = 'utf8'));
    end_connection();
    console.log("Done!");
}