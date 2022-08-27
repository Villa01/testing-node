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

    try {
        const urlPerfil = await uploadFile(nombreArchivo, fotoPerfil.data);

        const query = 'CALL proyecto1.addUsuario($1, $2, $3, $4)';
        const params = [username, email, encrypted_pass, urlPerfil];
        // Insertar en la base de datos
        const client = await dbConnection();
        await client.query(query, params);

        return res.status(201).json({ msg: 'Usuario creado con exito.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo insertar el usuario, consulte con el administrador. '
        })
    }

}

const getUserByUsername = async(req = request, res = response) => {
    const { username } = req.params;

    const query = 'SELECT proyecto1.getUsuario($1)';
    const params = [username];
    
    try {
        // Obtener usuario en la BDD
        const client = await dbConnection();
        const user = await client.query(query, params);
        console.log(user)

        if (user.rowCount < 1) {
            return res.status(404).json({
                msg: `No se encontró ningún usuario asociado al username ${username}`
            })
        }

        return res.status(200).json(user.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo insertar el usuario, consulte con el administrador. '
        })
    }
}


module.exports = {
    createUser,
    getUserByUsername, 
}