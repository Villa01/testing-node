const { request, response } = require('express');

const { dbConnection } = require('../database/config');
const { logIn } = require('../helpers/auth');
const { uploadFile, deleteFile } = require('../helpers/awss3');
const { accesoArchivos } = require('../middlewares/archivos');

const createFile = async (req = request, res = response) => {

    // Subir archivo a s3
    const file = req.files.file;

    const { acceso = accesoArchivos.publico, idUsuario } = req.body;
    let client;
    try {
        const { url: urlPerfil, nombre } = await uploadFile(file.name, file.data);
        // CALL proyecto1.addArchivo(nombre, url, tipo, acceso, usuario, retorno)
        const query = 'CALL proyecto1.addArchivo($1, $2, $3, $4, $5, 0)';
        const params = [nombre, urlPerfil, file.mimetype, acceso, idUsuario];

        // Insertar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);


        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo insertar el archivo. Porque el nombre está repetido' })

        return res.status(201).json({ msg: 'Archivo creado con exito.' });
    } catch (err) {
        console.error(err);
        if (err.code === '23503') {
            return res.status(400).json({
                msg: `No se pudo insertar el archivo: porque el usuario no existe. `
            })
        }

        return res.status(500).json({
            msg: `No se pudo insertar el archivo: ${err}`
        })
    } finally {
        client.release(true);
    }

}

const getArchivos = async (req = request, res = response) => {

    const { idUsuario, acceso = accesoArchivos.todos } = req.params;
    //select * from proyecto1.getArchivo(id, acceso); No pude usar el sp :(

    const query = `select * from proyecto1.getArchivo($1,$2);`;
    const params = [idUsuario, acceso];
    let client;
    try {

        // Insertar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);

        return res.status(200).json({ archivos: rows });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            msg: `No fue posible obtener los archivos`
        })
    } finally {
        client.release(true);
    }
}


const getPublicFiles = async (req = request, res = response) => {
    const { idUsuario } = req.params;

    const query = `select * from proyecto1.getArchivos($1);`;
    const params = [idUsuario];
    let client;
    try {

        // Insertar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);

        return res.status(200).json({ archivos: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: `No fue posible obtener los archivos`
        })
    } finally {
        client.release(true);
    }
}

const deleteArchivo = async (req = request, res = response) => {

    const { username, password, nombreArchivo } = req.body;

    let idUsuario;
    try {

        const { data } = await logIn(username, password)
        idUsuario = data.id;
    } catch (error) {
        return res.status(400).json(error);
    }


    let client;
    try {

        // Eliminar logicamente 
        const query = 'CALL proyecto1.deleteArchivo($1, $2, 1)'
        const params = [nombreArchivo, idUsuario];

        // const response = await deleteFile(nombreArchivo);

        // Eliminar en la base de datos
        client = await dbConnection().connect();
        const resp = await client.query(query, params);

        const { rows } = resp;
        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo eliminar el archivo, el archivo no existe.' })

        return res.status(204).send();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: 'No se pudo eliminar el archivo, contacte con el administrador'
        });
    } finally {
        client?.release(true);
    }
}

const updateArchivo = async (req = request, res = response) => {
    const { username, password, nombreArchivo, acceso, nombreNuevo } = req.body;

    let idUsuario;
    try {

        const { data } = await logIn(username, password)
        idUsuario = data.id;
    } catch (error) {
        return res.status(400).json(error);
    }

    let client;
    try {
        // updateArchivo(nombreAnterior:string, user:int, nombreNuevo:string, acceso:int)retorno:int
        const query = 'CALL proyecto1.updateArchivo($1, $2, $3, $4,0)'
        const params = [nombreArchivo, idUsuario, nombreNuevo, acceso];

        // Modificar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);

        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo modificar el archivo.' })

        return res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'No se pudo modificar el archivo, contacte con el administrador'
        });
    } finally {
        client.release(true);
    }
}

module.exports = {
    createFile,
    getArchivos,
    deleteArchivo,
    updateArchivo,
    getPublicFiles
}