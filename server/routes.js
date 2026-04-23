const express = require('express');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();

// el sistema guarda los archivos en temp primero para luego renombrarlos y moverlos
const upload = multer({ dest: path.join(__dirname, '..', 'public', 'assets', 'temp') });

// ruta para encuesta mediante qr
router.get('/encuesta', (req, res) => {
    // encabezados para que el navegador no guarde la pagina en memoria
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('Surrogate-Control', 'no-store');

    const { acceso, source } = req.query;

    // si el usuario viene con el link del qr (acceso=mitre-vip)
    if (acceso === 'mitre-vip') {
        // borramos la cookie de bloqueo anterior para permitir una nueva encuesta
        res.clearCookie('encuesta_completada');
        return res.render('encuesta', { source: source || 'directo' });
    }

    // si intenta volver atras (sin el acceso en la url) y ya la completo, se va al inicio
    if (req.cookies && req.cookies.encuesta_completada === 'true') {
        return res.redirect('/');
    }

    // si no tiene acceso ni cookie (intento de entrada manual), al inicio
    res.redirect('/');
});

// envio de encuesta al back con validaciones de seguridad
router.post('/enviar-encuesta', async (req, res) => {
    const SCRIPT_URL = process.env.GOOGLE_URL_KEY;

    try {
        const { nombre, apellido, nacimiento, whatsapp, localidad, platos, atencion, ambiente, invitar } = req.body;

        // validaciones de longitud en el servidor
        if (!nombre || nombre.length > 15) {
            return res.status(400).json({ success: false, message: 'nombre demasiado largo o vacio.' });
        }
        if (!apellido || apellido.length > 15) {
            return res.status(400).json({ success: false, message: 'apellido demasiado largo o vacio.' });
        }

        // validacion de edad minima
        const nacDate = new Date(nacimiento + 'T00:00:00');
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacDate.getFullYear();
        const m = hoy.getMonth() - nacDate.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacDate.getDate())) edad--;

        if (isNaN(nacDate.getTime()) || edad < 13 || edad > 100) {
            return res.status(400).json({ success: false, message: 'fecha de nacimiento invalida.' });
        }

        // validacion de campos requeridos
        if (!whatsapp || !localidad || !platos || !atencion || !ambiente || !invitar) {
            return res.status(400).json({ success: false, message: 'faltan campos obligatorios.' });
        }

        // se agrega validatestatus para evitar que el 302 de google dispare el catch
        await axios.get(SCRIPT_URL, { 
            params: req.body,
            validateStatus: (status) => status >= 200 && status <= 302 
        });

        // creamos la cookie que servira para bloquear el boton atras
        res.cookie('encuesta_completada', 'true', { 
            maxAge: 24 * 60 * 60 * 1000, 
            httpOnly: true,
            sameSite: 'lax',
            secure: true 
        });

        res.status(200).json({ success: true, message: 'datos guardados correctamente' });
    } catch (error) {
        console.error('error en el servidor:', error);
        res.status(500).json({ success: false, message: 'error al conectar con el servidor de datos' });
    }
});

// proteccion de rutas de administrador
const protectedAdmin = (req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');

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

// rutas publicas del sitio
router.get('/', (req, res) => {
    res.render('index', { page: 'inicio' });
});

router.get('/nuestra-carta', (req, res) => {
    // lectura de datos dinamicos para la carta desde un json
    const rutaData = path.join(__dirname, '..', 'data', 'textos.json');
    let textos = {};
    
    if (fs.existsSync(rutaData)) {
        textos = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));
    }
    
    // se pasan los textos dinamicos a la vista para que cada una de las 4 secciones los use
    res.render('nuestra_carta', { page: 'carta', textos: textos });
});

router.get('/nosotros', (req, res) => {
    res.render('nosotros', { page: 'nosotros' });
});

router.get('/ubicacion', (req, res) => {
    res.render('ubicacion_horarios', { page: 'ubicacion' });
});

// logeo de administrador
router.get('/login', (req, res) => {
    res.render('admin/login', { page: 'login' });
});

// validacion de logeo
router.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
        const token = jwt.sign({ user }, process.env.JWT_SECRET || 'clavemitrebar', { expiresIn: '15m' });
        res.cookie('adminToken', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
        return res.redirect('/admin');
    }
    res.render('admin/login', { page: 'login', error: 'error: usuario o contraseña incorrectos.' });
});

router.get('/logout', (req, res) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.clearCookie('adminToken');
    res.redirect('/login');
});

// ruta de panel de administracion protegida
router.get('/admin', protectedAdmin, (req, res) => {
    res.render('admin/panel', { 
        page: 'admin', 
        user: req.user 
    });
});

// ruta para subir archivos y actualizar textos
router.post('/admin/upload', protectedAdmin, upload.fields([
    { name: 'imagenPreview', maxCount: 1 },
    { name: 'archivoPdf', maxCount: 1 }
]), async (req, res) => {
    const { nombreSeccion, descripcion } = req.body;
    const files = req.files;

    // guardado de descripcion en json
    if (descripcion && descripcion.trim() !== "") {
        const rutaDir = path.join(__dirname, '..', 'data');
        const rutaData = path.join(rutaDir, 'textos.json');
        
        if (!fs.existsSync(rutaDir)) fs.mkdirSync(rutaDir);

        let textos = fs.existsSync(rutaData) ? JSON.parse(fs.readFileSync(rutaData, 'utf-8')) : {};
        textos[nombreSeccion] = descripcion;
        fs.writeFileSync(rutaData, JSON.stringify(textos, null, 2));
    }

    // procesamiento de imagen con sharp
    if (files['imagenPreview']) {
        const file = files['imagenPreview'][0];
        const nombreFijo = `preview-${nombreSeccion}.webp`;
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'preview_cartas', nombreFijo);
        
        await sharp(file.path)
            .webp({ quality: 80 })
            .toFile(targetPath);
            
        fs.unlinkSync(file.path);
    }

    // procesamiento de archivo pdf
    if (files['archivoPdf']) {
        const file = files['archivoPdf'][0];
        const nombrePdfFijo = `${nombreSeccion}.pdf`;
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'cartas_pdf', nombrePdfFijo);
        
        fs.renameSync(file.path, targetPath);
    }

    res.render('admin/panel', {
        page: 'admin',
        user: req.user,
        mensaje: `la seccion "${nombreSeccion}" se actualizo correctamente.`
    });
});

module.exports = router;