require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const arrendamientoRoutes = require('./routes/arrendamiento.routes');
const abonoRoutes = require('./routes/abono.routes');

const db = require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
    res.send('API Majai funcionando 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/arrendamiento', arrendamientoRoutes);
app.use('/api/abonos', abonoRoutes);

// DB + Server
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await db.sequelize.authenticate();
        console.log('✅ DB conectada');

        await db.sequelize.sync({
            alter: true
        }); // luego puedes usar migrations
        console.log('✅ Modelos sincronizados');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
    }
})();
