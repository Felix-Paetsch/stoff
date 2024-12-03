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

const db_init_pool = new (require('pg').Pool)(client_conf)

db_init_pool.query(`DROP DATABASE IF EXISTS ${ DB_CONF.pg_database }`, (err, res) => {
    db_init_pool.query(`CREATE DATABASE ${ DB_CONF.pg_database }`, (err, res) => {
        db_init_pool.end();
        if (err) throw (err);
        
        run_table_init_queries();
    })
})

async function run_table_init_queries(){
    const { make_query, end_connection } = require('../db_connection.js');

    queries = [
        fs.readFileSync("database_handling/sql/tables.sql", encoding = 'utf8'),
        fs.readFileSync("database_handling/sql/functions.sql", encoding = 'utf8')
    ];

    for (i in queries){
        if (typeof queries[i] == "object"){
            await make_query(...queries[i])
        } else {
            await make_query(queries[i]);
        }
    }
    
    end_connection();
    console.log("Done!");
}