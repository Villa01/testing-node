
const { Router } = require('express');
const { check, param } = require('express-validator');


const {
    createFile,
    getArchivos,
    deleteArchivo,
    updateArchivo,
    getPublicFiles
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

router.get('/amigos/:idUsuario', [
    param('idUsuario', 'Se necesita el idUsuario').notEmpty(),
    validateAtributes,
    getAcceso,
],
    getPublicFiles
);

router.get('/:acceso/:idUsuario', [
    param('idUsuario', 'Se necesita el idUsuario').notEmpty(),
    validateAtributes,
    (req, res, next) => {
        const acceso = req.params.acceso;
        req.params.acceso = accesoArchivos[acceso];
        next();
    }

],
    getArchivos
);

router.delete('/', [
    check('password', 'Se necesita el password').notEmpty(),
    check('username', 'Se necesita el idUsuario').notEmpty(),
    check('nombreArchivo', 'Se necesita el nombre del archivo').notEmpty(),
    validateAtributes,
],
    deleteArchivo
);

router.put('/', [
    check('password', 'Se necesita el password').notEmpty(),
    check('username', 'Se necesita el idUsuario').notEmpty(),
    check('acceso', 'Se require el acceso del archivo').optional(),
    getAcceso,
    check('nombreArchivo', 'Se necesita el nombre del archivo').notEmpty(),
    check('nombreNuevo', 'Se necesita el nombreNuevo').notEmpty(),
    validateAtributes,
],
    updateArchivo
);

module.exports = router;