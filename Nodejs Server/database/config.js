const { Pool } = require('pg');

let pool;


module.exports = {
    dbConnection: () => {

        const connectionData = {
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: 5432,
        }
        if (pool) return pool;
        return pool = new Pool(connectionData);
    }
};