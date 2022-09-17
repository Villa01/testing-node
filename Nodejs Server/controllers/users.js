const { response, request } = require('express');

const { dbConnection } = require('../database/config');
const { uploadFile } = require('../helpers/awss3');

const { encrypt } = require('../helpers/encryption');

const createUser = async (req = request, res = response) => {

    const { username, email, password } = req.body;

    // Encriptar
    const encrypted_pass = encrypt(password);

    // Subir imagen a s3
    const fotoPerfil = req.files.fotoPerfil;
    // Crear el nombre con la forma username-profile.png
    const extension = fotoPerfil.name.substring(fotoPerfil.name.lastIndexOf('.'));
    const nombreArchivo = `${username.replace(/[^\w\s]/gi, '')}-profile${extension}`;
    let client;
    try {
        const { url: urlPerfil, nombre } = await uploadFile(nombreArchivo, fotoPerfil.data);

        const query = 'CALL proyecto1.addUsuario($1, $2, $3, $4, 0)';
        const params = [username, email, encrypted_pass, urlPerfil];

        // Insertar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);

        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo insertar el usuario.' })

        return res.status(201).json({ msg: 'Usuario creado con exito.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo insertar el usuario, consulte con el administrador. '
        })
    } finally {
        client.release(true);
    }

}

const addFriend = async (req = request, res = response) => {

    const { idUsuarioActual, idAmigo } = req.body;
    let client;

    try {
        const query = 'CALL proyecto1.addFriend($1, $2,0)';
        const params = [idUsuarioActual, idAmigo];

        // Insertar en la base de datos
        client = await dbConnection().connect();
        const { rows } = await client.query(query, params);

        if (rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({ msg: 'No se pudo agregar el amigo.' })

        return res.status(201).json({ msg: 'Amigo agregado con exito.' });
    } catch (err) {
        console.error(err.error);
        return res.status(500).json({
            msg: 'No se pudo agregar el amigo, consulte con el administrador. '
        })
    } finally {
        client.release(true);
    }

}



const getUserByUsername = async (req = request, res = response) => {
    const { username } = req.params;

    const query = 'SELECT * FROM proyecto1.getUsuario($1)';
    const params = [username];
    let client;

    try {
        // Obtener usuario en la BDD
        client = await dbConnection().connect();
        const user = await client.query(query, params);

        if (user.rowCount < 1) {
            return res.status(404).json({
                msg: `No se encontró ningún usuario asociado al username ${username}`
            })
        }

        return res.status(200).json(user.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo obtener el usuario, consulte con el administrador. '
        })
    } finally {
        client.release(true);
    }
}

// Obtiene todos los usuarios disponibles para agregarlos. 
const getAllUsers = async (req = request, res = response) => {

    const { idUsuario } = req.params;

    const query = 'SELECT * FROM proyecto1.getUsers($1)';
    const params = [idUsuario];
    let client;

    try {
        client = await dbConnection().connect();
        const user = await client.query(query, params);

        return res.status(200).json({ usuarios: user.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo obtener los usuarios, consulte con el administrador. '
        })
    } finally {
        client.release(true);
    }
}


module.exports = {
    createUser,
    getUserByUsername,
    getAllUsers,
    addFriend
}