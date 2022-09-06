

const accesoArchivos = {
    'publico': 0,
    'privado': 1,
    'todos': 2
}


const getAcceso = (req, res, next) => {
    const acceso = req.body.acceso;
    req.body.acceso = accesoArchivos[acceso];
    next();
}


module.exports = {
    getAcceso,
    accesoArchivos
}