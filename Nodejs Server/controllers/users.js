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

    console.log(nombreArchivo)


    try {
        const urlPerfil = await uploadFile(nombreArchivo, fotoPerfil.data);

        console.log(urlPerfil)
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

module.exports = {
    createUser
}