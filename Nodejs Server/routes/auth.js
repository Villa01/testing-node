
const { Router } = require('express');
const { check, param } = require('express-validator');


const { 
    validarPassword
} = require('../controllers/auth');
const validateAtributes = require('../middlewares/validate-atributes');

const router = Router();


router.post('/',[

    check('username', 'Se necesita el username').notEmpty(),
    check('password', 'Se necesita la contraseña').notEmpty(),
    validateAtributes
],
validarPassword);

module.exports = router;