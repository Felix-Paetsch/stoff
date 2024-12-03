const fs = require('fs');
const { CONF } = require("../config.js");

const client_conf = {
    user: CONF.pg_user,
    host: CONF.pg_host,
    password: CONF.pg_password,
    port: CONF.pg_port,
    database: CONF.pg_main_database
}

if (CONF.pg_ssl){
    client_conf.ssl = {
        rejectUnauthorized: false
    }
}

run_data_queries();

async function run_data_queries(){
    const { make_query, end_connection } = require('../db_connection.js');
    
    await make_query(fs.readFileSync("database_handling/sql/data_setup.sql", encoding = 'utf8'));
    console.log("Done!");

    end_connection();
}