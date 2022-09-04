
const { Router } = require('express');
const { check } = require('express-validator');


const {
    createFile
} = require('../controllers/file');
const validateAtributes = require('../middlewares/validate-atributes');

const router = Router();

const accesoArchivos = {
    'publico': 1,
    'privado': 2
}


router.post('/', [
    check('nombre', 'Se necesita el nombre').optional(),
    check('acceso', 'Se necesita el acceso').notEmpty(),
    check('acceso', `El tipo debe ser ${Object.keys(accesoArchivos)}`).isIn(Object.keys(accesoArchivos)),
    check('idUsuario', 'Se necesita el idUsuario').notEmpty(),
    check('files').custom((value, { req }) => {
        if (!req.files || !req.files.file) {
            throw new Error('No se ha recibido el archivo')
        }
        return true;
    }),
    validateAtributes,
    // Obtener valor numérico del acceso del archivo
    (req, res, next) => {
        const acceso = req.body.acceso;
        req.body.acceso = accesoArchivos[acceso];
        next();
    },
],
    createFile);

module.exports = router;