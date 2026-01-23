const express = require('express');
const router = express.Router();
const abonoController = require('../controllers/abono.controller');

// POST /api/abonos/crear - Crear un nuevo abono
router.post('/crear', abonoController.createAbono);

// GET /api/abonos/listar - Obtener todos los abonos
router.get('/listar', abonoController.getAbonos);

// GET /api/abonos/ver/:id - Obtener un abono por ID
router.get('/ver/:id', abonoController.getAbonoById);

// GET /api/abonos/arrendamiento/:id - Obtener abonos por ID de arrendamiento
router.get('/arrendamiento/:id', abonoController.getAbonosByArrendamiento);

// GET /api/abonos/usuario/:id - Obtener abonos por usuario
router.get('/usuario/:id', abonoController.getAbonosByUsuario);

// PUT /api/abonos/editar/:id - Actualizar un abono
router.put('/editar/:id', abonoController.updateAbono);

// DELETE /api/abonos/eliminar/:id - Eliminar un abono
router.delete('/eliminar/:id', abonoController.deleteAbono);

module.exports = router;
