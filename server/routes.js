const express = require('express');
const router = express.Router();
const path = require('path');

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

module.exports = router;