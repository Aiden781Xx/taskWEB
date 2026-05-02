const express = require('express');
const router = express.Router();
const { register, login, getMe, registerValidation, loginValidation } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', authenticate, getMe);

module.exports = router;
