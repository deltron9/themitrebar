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
    // esto evita que el navegador use la versión guardada (atrás/adelante)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { acceso, source } = req.query;

    if (req.cookies && req.cookies.encuesta_completada === 'true') {
        return res.redirect('/');
    }

    if (acceso === 'mitre-vip') {
        res.render('encuesta', { source: source || 'directo' });
    } else {
        res.redirect('/');
    }
});

// envio de encuesta al back ya validada 
router.post('/enviar-encuesta', async (req, res) => {
    const SCRIPT_URL = process.env.GOOGLE_URL_KEY;

    try {
        //los datos recibidos se alojan en el body
        const datos = req.body;

        // se agrega validateStatus para evitar que el 302 de Google dispare el catch
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
    //lectura de datos dinámicos para la carta desde un JSON
    const rutaData = path.join(__dirname, '..', 'data', 'textos.json');
    let textos = {};
    
    if (fs.existsSync(rutaData)) {
        textos = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));
    }
    
    //se pasan los textos dinámicos a la vista para que cada una de las 4 secciones los use
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

//validacion de logeo
//las credenciales estan alojadas en variables de entorno
//el token de autentificacion dura 15 min y luego se cierra la sesion y te devuelve al login
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
    // Pasamos explícitamente el objeto req.user para que locals.user sea verdadero
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
    // "nombreSeccion" identifica cual de las 4 cartas se está tocando
    const { nombreSeccion, descripcion } = req.body;
    const files = req.files;

    //guardado de la descripcion en un JSON para cada seccion
    if (descripcion && descripcion.trim() !== "") {
        const rutaDir = path.join(__dirname, '..', 'data');
        const rutaData = path.join(rutaDir, 'textos.json');
        
        if (!fs.existsSync(rutaDir)) fs.mkdirSync(rutaDir);

        let textos = fs.existsSync(rutaData) ? JSON.parse(fs.readFileSync(rutaData, 'utf-8')) : {};
        
        //se guarda el texto usando el nombre de la sección como clave para independencia de las 4 cartas
        textos[nombreSeccion] = descripcion;
        fs.writeFileSync(rutaData, JSON.stringify(textos, null, 2));
    }

    //procesamiento de imagen de preview (renombrado automático y ubicación en carpeta correspondiente)
    if (files['imagenPreview']) {
        const file = files['imagenPreview'][0];
        
        // se genera el nombre basado en loa sección seleccionada (ej: preview-menu-ejecutivo.webp)
        const nombreFijo = `preview-${nombreSeccion}.webp`;
        //se direcciona a la carpeta 'preview_cartas'
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'preview_cartas', nombreFijo);
        
        // Procesamiento con Sharp para convertir a WebP
        await sharp(file.path)
            .webp({ quality: 80 })
            .toFile(targetPath);
            
        // Eliminar el archivo temporal original
        fs.unlinkSync(file.path);
    }

    //procesamiento de archivo PDF (renombrado automático y ubicación en carpeta cartas_pdf)
    if (files['archivoPdf']) {
        const file = files['archivoPdf'][0];
        
        //se fuerza el nombre del archivo PDF según la sección (ej: recomendacion-chef.pdf)
        const nombrePdfFijo = `${nombreSeccion}.pdf`;
        //se direcciona a la carpeta 'cartas_pdf'
        const targetPath = path.join(__dirname, '..', 'public', 'assets', 'cartas_pdf', nombrePdfFijo);
        
        //mover y renombrar físicamente (sobrescribe la versión anterior automáticamente)
        fs.renameSync(file.path, targetPath);
    }

    res.render('admin/panel', {
        page: 'admin',
        user: req.user,
        mensaje: `La sección "${nombreSeccion}" se actualizó correctamente.`
    });
});

module.exports = router;