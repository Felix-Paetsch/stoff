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

run_test_queries();

async function run_test_queries(){
    const { make_query, end_connection } = require('../db_connection.js');
    const splitted = fs.readFileSync("database_handling/test.sql", encoding = 'utf8').split("-- sep --");

    for (const query in splitted){
        console.log("===================");
        console.log("Query:", splitted[query].trim());
        
        const res = await make_query(splitted[query]);

        console.log("Result:", res.rows);
        console.log("===================");

    }

    end_connection();
    console.log("Done!");
}