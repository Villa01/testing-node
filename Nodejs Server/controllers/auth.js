const { compareEncrypted } = require('../helpers/encryption');

const validarPassword = async(req = request, res = response) => {
    const { username, password } = req.body;

    const query = 'SELECT proyecto1.getUsuario($1)';
    const params = [username];

    let user;
    
    try {
        // Obtener usuario en la BDD
        const client = await dbConnection();
        user = await client.query(query, params);

        if (user.rowCount < 1) {
            return res.status(404).json({
                msg: `No se encontró ningún usuario asociado al username ${username}`
            })
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo insertar el usuario, consulte con el administrador. '
        })
    }


    if(!compareEncrypted(password, user.password)){
        return res.status(400).json({
            msg: 'User / Password no son correctos - password'
        })
    }

    return res.json({
        user
    })
}

module.exports = {
    validarPassword
}