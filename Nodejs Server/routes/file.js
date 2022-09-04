
const { Router } = require('express');
const { check } = require('express-validator');


const {
    createFile, getArchivos
} = require('../controllers/file');
const { getAcceso, accesoArchivos } = require('../middlewares/archivos');
const validateAtributes = require('../middlewares/validate-atributes');

const router = Router();


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
    getAcceso,
],
    createFile);

router.get('/', [
    getAcceso,
],
    getArchivos
);

module.exports = router;