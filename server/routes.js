const express = require('express');
const router = express.Router();
const path = require('path');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//JWT Middleware para proteger rutas de administrador
const protectedAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretomitre');
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminToken');
        res.redirect('/login');
    }
};

//paginas publicas 
router.get('/', (req, res) => {
    res.render('index', { page: 'inicio' });
});

router.get('/nuestra-carta', (req, res) => {
    res.render('nuestra_carta', { page: 'carta' });
});

router.get('/nosotros', (req, res) => {
    res.render('nosotros', { page: 'nosotros' });
});

router.get('/ubicacion', (req, res) => {
    res.render('ubicacion_horarios', { page: 'ubicacion' });
});

router.get('/login', (req, res) => {
    res.render('admin/login', { page: 'login' });
});

//validación de credenciales de administrador
router.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
        const token = jwt.sign({ user }, process.env.JWT_SECRET || 'clavemitrebar', { expiresIn: '15m' }); //el token tarda 15 min en expirar
        res.cookie('adminToken', token, { httpOnly: true, maxAge: 15 * 60 * 1000 }); //esto invalida la cookie despues de 15 min
        return res.redirect('/admin');
    }
    res.render('admin/login', { page: 'login', error: 'Credenciales incorrectas' });
});

//ruta de cerrar sesion
router.get('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/login');
});

//proteccion de ruta de admin
router.get('/admin', protectedAdmin, (req, res) => {
    res.render('admin/index', { page: 'admin' });
});

module.exports = router;