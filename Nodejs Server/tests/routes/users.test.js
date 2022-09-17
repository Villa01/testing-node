const path = require('path');
const request = require('supertest');

const { app: server } = require('../../app');

// Testing data
const baseURL = '/api/users';

const userName = `${new Date().getTime()}-testUser`;
const newUser = {
    'username': userName,
    'password': `123`,
    'password2': `123`,
    'email': `${userName}@test.com`
}

const userName2 = `${new Date().getTime()}2-testUser`;
const newUser2 = {
    'username': userName2,
    'password': `123`,
    'password2': `123`,
    'email': `${userName2}@test.com`
}

const createUser = (newUser) => {
    return new Promise((resolve, reject) => {

        const requestInstance = request(server).post(`${baseURL}/`)
            .set('Content-Type', 'application/json')

        // Add object's attributes to the request
        Object.keys(newUser).forEach(key => {
            requestInstance.field(key, newUser[key]);
        });

        requestInstance
            .attach('fotoPerfil', path.resolve(__dirname, '../logo.svg'))
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err)
            });
    })
}

const getUserByUsername = async (username) => {

    return await request(server).get(`${baseURL}/${username}`)
        .set('Content-Type', 'application/json')
}

describe('Users endpoints testing', () => {

    test(`POST ${baseURL}`, async () => {

        try {
            const response = await createUser(newUser);
            expect(response.status).toEqual(201)
            expect(response.body.msg).toEqual('Usuario creado con exito.');

        } catch (err) {
            console.error(err)
        }
    })

    test(`POST ${baseURL}/:username`, async () => {

        const response = await getUserByUsername(newUser.username);

        expect(response.status).toEqual(200);
    })

    test(`POST ${baseURL}/add/`, async () => {

        await createUser(newUser2);

        const [resp1, resp2] = await Promise.all([
            getUserByUsername(newUser.username),
            getUserByUsername(newUser2.username)
        ])

        const body = {
            idUsuarioActual: resp1.body.id,
            idAmigo: resp2.body.id
        }
        const response = await request(server).post(`${baseURL}/add/`)
            .send(body)

        expect(response.status).toEqual(201)
        expect(response.body.msg).toEqual('Amigo agregado con exito.');
    })

    test(`POST ${baseURL}/all/:idUsuario`, async () => {
        const respId = getUserByUsername(newUser.username);
        const id = (await respId).body.id;

        const response = await request(server).get(`${baseURL}/all/${id}`)
            .set('Content-Type', 'application/json')

        expect(response.status).toEqual(200);

    })

    afterAll(async () => {

        const { dbConnection } = require('../../database/config');
        await dbConnection().end();
    });
})

