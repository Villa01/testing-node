const path = require('path');
const request = require('supertest');

const { app: server } = require('../../app');
const { createUser, getUserByUsername } = require('./users.test');

// Testing data
const baseURL = '/api/file';

const userName = `${new Date().getTime()}-testFileUser`;
const newUser = {
    'username': userName,
    'password': `123`,
    'password2': `123`,
    'email': `${userName}@test.com`
}

const newFileName = `${new Date().getTime()}-testFile`;

const newFile = {
    nombre: newFileName,
    acceso: 'privado',
    idUsuario: 20
}

const createTestFile = (newFile) => {
    return new Promise((resolve, reject) => {

        const requestInstance = request(server).post(`${baseURL}/`)
            .set('Content-Type', 'application/json')

        // Add object's attributes to the request
        Object.keys(newFile).forEach(key => {
            requestInstance.field(key, newFile[key]);
        });

        requestInstance
            .attach('file', path.resolve(__dirname, '../logo.svg'))
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err)
            });
    })
}

const getTestFiles = async (access = 'publico') => {
    return await request(server).get(`${baseURL}/${access}/${newUser.id}`)
        .set('Content-Type', 'application/json')
}

describe('File endpoints testing', () => {


    beforeAll(async () => {

        await createUser(newUser)
        const getUserResp = (await getUserByUsername(newUser.username)).body;
        newUser.id = getUserResp.id;
    })

    test(`POST ${baseURL}`, async () => {

        newFile.idUsuario = newUser.id;
        const response = await createTestFile(newFile);
        expect(response.status).toEqual(201)
        expect(response.body.msg).toEqual('Archivo creado con exito.');

    });

    test(`GET ${baseURL}/amigos/:idUsuario`, async () => {
        const response = await request(server).get(`${baseURL}/amigos/${newUser.id}`)
            .set('Content-Type', 'application/json')

        expect(response.status).toEqual(200);
    });

    test(`GET ${baseURL}/publico/:idUsuario`, async () => {
        const response = await request(server).get(`${baseURL}/publico/${newUser.id}`)
            .set('Content-Type', 'application/json')

        expect(response.status).toEqual(200);
    });

    test(`PUT ${baseURL}/`, async () => {

        // Get previously created file
        const filesRequest = await getTestFiles('privado');
        const fileInserted = filesRequest.body.archivos[0];
        newFile.id = fileInserted.id;

        const body = {
            password: newUser.password,
            username: newUser.username,
            acceso: 'publico',
            nombreArchivo: fileInserted.nombre,
            nombreNuevo: `${fileInserted.nombre}-newName`
        }


        // Create put request
        const response = await request(server).put(`${baseURL}/`)
            .set('Content-Type', 'application/json')
            .send(body)

        expect(response.status).toEqual(204)

        newFile.nombre = fileInserted.nombre + '-newName'
    })

    test(`DELETE ${baseURL}/`, async () => {

        // Get previously created file

        const body = {
            password: newUser.password,
            username: newUser.username,
            nombreArchivo: newFile.nombre,
        }

        // Create put request
        const response = await request(server).delete(`${baseURL}/`)
            .set('Content-Type', 'application/json')
            .send(body)
        expect(response.status).toEqual(204)
    })



    afterAll(async () => {
        const { dbConnection } = require('../../database/config');
        await dbConnection().end();
    });
})

