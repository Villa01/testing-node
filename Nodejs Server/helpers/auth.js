const { dbConnection } = require('../database/config');
const { compareEncrypted } = require('./encryption');


const logIn = (username, password) => {

    return new Promise(async (resolve, reject) => {
        const query = 'SELECT * from proyecto1.getUsuario($1)';
        const params = [username];

        let user;
        try {
            // Obtener usuario en la BDD
            const client = await dbConnection();
            const data = await client.query(query, params);
            if (data.rowCount < 1) {
                reject({
                    msg: `No se encontró ningún usuario asociado al username ${username}`
                });
            }

            user = data.rows[0];

        } catch (err) {
            console.error(err);
            reject({
                msg: 'No se pudo obtener el usuario, consulte con el administrador. '
            })
        }

        if (!compareEncrypted(password, user.password)) {
            reject({
                msg: 'User / Password no son correctos - password'
            })
        }

        const { password: pass, ...data } = user;
        resolve({
            data
        })
    });


}

module.exports = {
    logIn
}