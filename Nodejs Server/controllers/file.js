const { dbConnection } = require('../database/config');
const { uploadFile } = require('../helpers/awss3');

const accesoArchivos = {
    publico: 1, 
    privado: 2,
}


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
        const {rows} = await client.query(query, params);


        if( rows.length < 0 || rows[0].ret === 0)
            return res.status(400).json({msg: 'No se pudo insertar el archivo.'})

        return res.status(201).json({ msg: 'Archivo creado con exito.' });
    } catch (err) {
        console.error(err);
        if(err.code === '23503') {
            return res.status(400).json({
                msg: `No se pudo insertar el archivo: porque el usuario no existe. `
            })
        }

        return res.status(500).json({
            msg: `No se pudo insertar el archivo: ${err.error}`
        })
    }

}
module.exports = {
    createFile
}