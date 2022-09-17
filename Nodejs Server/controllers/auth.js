const { compareEncrypted } = require('../helpers/encryption');
const { dbConnection } = require('../database/config');

const validarPassword = async (req = request, res = response) => {
    const { username, password } = req.body;

    const query = 'SELECT * from proyecto1.getUsuario($1)';
    const params = [username];

    let user;
    let client;
    try {
        // Obtener usuario en la BDD
        client = await dbConnection().connect();
        const data = await client.query(query, params);
        if (data.rowCount < 1) {
            return res.status(404).json({
                msg: `No se encontró ningún usuario asociado al username ${username}`
            })
        }

        user = data.rows[0];
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: 'No se pudo insertar el usuario, consulte con el administrador. '
        })
    } finally {
        client.release(true);
    }


    if (!compareEncrypted(password, user.password)) {
        return res.status(400).json({
            msg: 'User / Password no son correctos - password'
        })
    }

    const { password: pass, ...data } = user;
    return res.json({
        data
    })
}

module.exports = {
    validarPassword
}