
const { Router } = require('express');
const { check } = require('express-validator');


const { createUser } = require('../controllers/users');
const validateAtributes = require('../middlewares/validate-atributes');

const router = Router();


router.post('/',[

    check('username', 'Se necesita el username').notEmpty(),
    check('password', 'Se necesita la contraseña').notEmpty(),
    check('password2', 'Se necesita confirmar la contraseña').notEmpty(),
    check('password').custom((value, {req}) => {
        if(value !== req.body.password2)
            throw new Error('Las contraseñas no coinciden.')
        return true
    }),
    check('email', 'Se necesita el email').notEmpty(),
    check('email', 'El email no es valido').isEmail(),
    validateAtributes
],

createUser);


module.exports = router;