const express = require('express');
const cors = require('cors');


class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT ?? 5000;
        this.paths = {
            users: '/api/users',
        }

        // Connect Db
        // this.connectDB();

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

    }

    async connectDB() {
        await dbConnection();
    }

    routes() {
        // this.app.use(this.paths.users, require('../routes/users'));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Server on port', this.port);
        })
    }
}

module.exports = Server;