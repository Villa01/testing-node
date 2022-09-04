const { request, response } = require('express');

const { dbConnection } = require('../database/config');
const { logIn } = require('../helpers/auth');
const { uploadFile } = require('../helpers/awss3');
const { accesoArchivos } = require('../middlewares/archivos');

const createFile = async (req = request, res = response) => {

    // Subir archivo a s3
    const file = req.files.file;

    const { nombre = file.name, acceso = accesoArchivos.publico, idUsuario } = req.body;
    try {
        const urlPerfil = await uploadFile(file.name, file.data);
        // CALL proyecto1.addArchivo(nombre, url, tipo, acceso, usuario, retorno)
        const query = 'CALL proyecto1.addArchivo($1, $2, $3, $4, $5, 0)';
        const params = [nombre, urlPerfil, file.mimetype, acceso, idUsuario];

        // Insertar en la base de datos
        const client = await dbConnection();
        const { rows } = await client.query(query, params);


        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo insertar el archivo.' })

        return res.status(201).json({ msg: 'Archivo creado con exito.' });
    } catch (err) {
        console.error(err);
        if (err.code === '23503') {
            return res.status(400).json({
                msg: `No se pudo insertar el archivo: porque el usuario no existe. `
            })
        }

        return res.status(500).json({
            msg: `No se pudo insertar el archivo: ${err.error}`
        })
    }

}

const getArchivos = async (req = request, res = response) => {

    const { idUsuario, acceso = accesoArchivos.todos } = req.body;
    //select * from proyecto1.getArchivo(id, acceso); No pude usar el sp :(

    const query = `select * from proyecto1.getArchivo($1,$2);`;
    const params = [idUsuario, acceso];
    try {

        // Insertar en la base de datos
        const client = await dbConnection();
        const { rows } = await client.query(query, params);

        return res.status(200).json({ archivos: rows });
    } catch (err) {
        console.error(err);
        // if(err.code === '23503') {
        //     return res.status(400).json({
        //         msg: `No se pudo insertar el archivo: porque el usuario no existe. `
        //     })
        // }

        return res.status(500).json({
            msg: `No fue posible obtener los archivos`
        })
    }
}


const deleteArchivo = async (req = request, res = response) => {

    const { username, password, nombreArchivo } = req.body;

    let idUsuario;
    try {

        const { id } = await logIn(username, password)
        idUsuario = id;
    } catch (error) {
        return res.status(400).json(error);
    }

    try {

        // Eliminar logicamente 
        // deleteArchivo(nombre:string, user:int)retorno:int
        const query = 'CALL proyecto1.deleteArchivo($1, $2)'
        const params = [nombreArchivo, idUsuario];

        // Eliminar en la base de datos
        const client = await dbConnection();
        const { rows } = await client.query(query, params);

        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo eliminar el archivo.' })

        return res.status(204).json({ msg: 'Archivo eliminado con exito.' });

    } catch (error) {
        res.status(500).json({
            msg: 'No se pudo eliminar el archivo, contacte con el administrador'
        });
    }
}

const updateArchivo = () => {

}

module.exports = {
    createFile,
    getArchivos,
    deleteArchivo,
    updateArchivo
}