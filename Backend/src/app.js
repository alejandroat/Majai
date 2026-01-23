const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const arrendamientoRoutes = require('./routes/arrendamiento.routes');
const abonoRoutes = require('./routes/abono.routes');

require('dotenv').config();


const app = express();


app.use(cors());
app.use(express.json());

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => res.json({ ok: true, message: 'API active' }));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/arrendamiento', arrendamientoRoutes);
app.use('/api/abonos', abonoRoutes);



// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});


module.exports = app;