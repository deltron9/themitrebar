require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const indexRoutes = require('./routes'); 
const PORT = process.env.PORT || 3000;

//configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.locals.page = ""; //si no se define en la ruta, no tira error
    next();
});

//uso de rutas
app.use('/', indexRoutes);

// renderizado para error 404
app.use((req, res) => {
    res.status(404).render('error', { page: 'error' });
});

app.listen(PORT, () => {
    console.log(`Servidor de The Mitre corriendo en http://localhost:${PORT}`);
});