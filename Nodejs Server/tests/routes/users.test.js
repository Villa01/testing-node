const server = require('../../app');
const request = require('supertest');
const { dbConnection } = require('../../database/config');

const baseURL = '/api/users';

describe('Users endpoints testing', () => {


    afterAll(async() => {
        await dbConnection().end();
    })

    test('should create a new user', async() => {

        const response = await request(server).get(`${baseURL}/all/20`);
        console.log(response)
    })

})