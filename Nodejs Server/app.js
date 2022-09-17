require('dotenv').config()

const Server = require('./models/server')


const server = new Server();

module.exports = server.getApp();