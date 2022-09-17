const express = require('express');
const cors = require('cors');
const fileupload = require('express-fileupload');
const morgan = require('morgan');
const { dbConnection } = require('../database/config');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT ?? 5000;
        this.paths = {
            users: '/api/users',
            healthcheck: '/healthcheck',
            auth: '/api/auth',
            file: '/api/file'
        }

        // Middlewares
        this.middlewares();

        // Routes of the app
        this.routes();
    }

    middlewares() {
        // CORS
        this.app.use(cors())

        // Body parsing
        this.app.use(express.json());

        // Logs 
        this.app.use(morgan('dev'));

        // Database
        dbConnection();

        // Files
        this.app.use(fileupload());
        this.app.use(express.urlencoded({ extended: true }));

    }

    routes() {
        this.app.get(this.paths.healthcheck, (req, res) => res.status(200).json({ok: "ok"}));
        this.app.use(this.paths.users, require('../routes/users'));
        this.app.use(this.paths.auth, require('../routes/auth'));
        this.app.use(this.paths.file, require('../routes/file'));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Server on port', this.port);
        })
    }

    async dbConnect () {
        this.app.dbPool = await dbConnection();
    }

    getApp () {
        return this.app;
    }
}

module.exports = Server;