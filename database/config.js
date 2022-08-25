const { Pool } = require('pg');

const connectionData = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: 5432,
}


const pool = new Pool(connectionData);
let client;

const dbConnection = async () => {
    try {
        client = await pool.connect();

        console.log('Database connected')
        return client;

    } catch (error) {
        console.error(error)
        throw new Error('Error when connecting to database')
    }
}


module.exports = {
    dbConnection,
    client
};