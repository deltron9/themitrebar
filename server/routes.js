const express = require('express');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();

//el sistema guarda los archivos en 'temp' primero para luego renombrarlos y moverlos
const upload = multer({ dest: path.join(__dirname, '..', 'public', 'assets', 'temp') });

//ruta para encuesta mediante QR
router.get('/encuesta', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { acceso, source } = req.query;

    if (acceso === 'mitre-vip') {
        res.clearCookie('encuesta_completada');
        return res.render('encuesta', { source: source || 'directo' });
    }

    if (req.cookies && req.cookies.encuesta_completada === 'true') {
        return res.redirect('/');
    }

    res.redirect('/');
});

// envio de encuesta al back ya validada 
router.post('/enviar-encuesta', async (req, res) => {
    const SCRIPT_URL = process.env.GOOGLE_URL_KEY;

    try {
        const datos = req.body;

        await axios.get(SCRIPT_URL, { 
            params: datos,
            validateStatus: (status) => status >= 200 && status <= 302 
        });

        res.cookie('encuesta_completada', 'true', { 
            maxAge: 24 * 60 * 60 * 1000, 
            httpOnly: true,
            sameSite: 'lax'
        });

        res.status(200).json({ success: true, message: 'Datos guardados correctamente' });
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ success: false, message: 'Error al conectar con el servidor de datos' });
    }
});

//protección de rutas de administrador
const protectedAdmin = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const token = req.cookies.adminToken;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clavemitrebar'); 
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminToken');
        res.redirect('/login');
    }
};

//rutas públicas del sitio
router.get('/', (req, res) => {
    res.render('index', { page: 'inicio' });
});

router.get('/nuestra-carta', (req, res) => {
    const rutaData = path.join(__dirname, '..', 'data', 'textos.json');
    let textos = {};
    
    if (fs.existsSync(rutaData)) {
        textos = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));
    }
    
    res.render('nuestra_carta', { page: 'carta', textos: textos });
});

router.get('/nosotros', (req, res) => {
    res.render('nosotros', { page: 'nosotros' });
});

router.get('/ubicacion', (req, res) => {
    res.render('ubicacion_horarios', { page: 'ubicacion' });
});

//logeo de administrador
router.get('/login', (req, res) => {
    res.render('admin/login', { page: 'login' });
});

router.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
        const token = jwt.sign({ user }, process.env.JWT_SECRET || 'clavemitrebar', { expiresIn: '15m' });
        res.cookie('adminToken', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
        return res.redirect('/admin');
    }
    res.render('admin/login', { page: 'login', error: 'ERROR: usuario o contraseña incorrectos.' });
});

router.get('/logout', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.clearCookie('adminToken');
    res.redirect('/login');
});

//ruta de panel de administracion, protegida por el middleware de autenticación
router.get('/admin', protectedAdmin, (req, res) => {
    res.render('admin/panel', { 
        page: 'admin', 
        user: req.user 
    });
});

//ruta para subir archivos y actualizar textos desde el panel de administración
router.post('/admin/upload', protectedAdmin, upload.fields([
    { name: 'imagenPreview', maxCount: 1 },
    { name: 'archivoPdf', maxCount: 1 }
]), async (req, res) => {
    const { nombreSeccion, descripcion } = req.body;
    const files = req.files;

    if (descripcion && descripcion.trim() !== "") {
        const rutaDir = path.join(__dirname, '..', 'data');
        const rutaData = path.join(rutaDir, 'textos.json');
        
        if (!fs.existsSync(rutaDir)) fs.mkdirSync(rutaDir);

        let textos = fs.existsSync(rutaData) ? JSON.parse(fs.readFileSync(rutaData, 'utf-8')) : {};
        
        textos[nombreSeccion] = descripcion;
        fs.writeFileSync(rutaData, JSON.stringify(textos, null, 2));
    }

    if (files['imagenPreview']) {
        const file = files['imagenPreview'][0];
        const nombreFijo = `preview-${nombreSeccion}.webp`;
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'preview_cartas', nombreFijo);
        
        await sharp(file.path)
            .webp({ quality: 80 })
            .toFile(targetPath);
            
        fs.unlinkSync(file.path);
    }

    if (files['archivoPdf']) {
        const file = files['archivoPdf'][0];
        const nombrePdfFijo = `${nombreSeccion}.pdf`;
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'cartas_pdf', nombrePdfFijo);
        
        fs.renameSync(file.path, targetPath);
    }

    res.render('admin/panel', {
        page: 'admin',
        user: req.user,
        mensaje: `La sección "${nombreSeccion}" se actualizó correctamente.`
    });
});

module.exports = router;