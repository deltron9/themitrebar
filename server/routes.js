const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

// Configuración de almacenamiento Multer
const storage = multer.diskStorage({ 
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'assets', 'cartas'));
    }, 
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        // Se usa el nombre del <select> para nombrar el archivo
        cb(null, req.body.nombreSeccion + extension);
    }
});

const upload = multer({ storage: storage });

// Middleware para proteger rutas de administrador
const protectedAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) return res.redirect('/login');

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET|| 'clavemitrebar'); 
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminToken');
        res.redirect('/login');
    }
};

//PAGINAS PUBLICAS
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

//acceso y login
router.get('/login', (req, res) => {
    res.render('admin/login', { page: 'login' });
});

router.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
        const token = jwt.sign({ user }, process.env.JWT_SECRET || 'clavemitrebar', { expiresIn: '15m' });
        res.cookie('adminToken', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
        // CORRECCIÓN: Redirección con barra inicial a /admin
        return res.redirect('/admin');
    }
    res.render('admin/login', { page: 'login', error: 'Credenciales incorrectas' });
});

router.get('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/login');
});

// --- PANEL DE ADMINISTRACIÓN (PROTEGIDO) ---
router.get('/admin', protectedAdmin, (req, res) => {
    res.render('admin/panel', { page: 'admin' });
});

router.post('/admin/upload', protectedAdmin, upload.single('imagen'), (req, res) => {
    res.render('admin/panel', {
        page: 'admin',
        mensaje: '¡Carta actualizada correctamente!'
    });
});

module.exports = router;
