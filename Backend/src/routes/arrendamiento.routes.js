const express = require('express');
const router = express.Router();
const arrendamientoController = require('../controllers/arrendamiento.controller');

router.post('/crear', arrendamientoController.createArrendamiento);
router.get('/listar', arrendamientoController.getArrendamientos);
router.get('/ver/:id', arrendamientoController.getArrendamientoById);
router.get('/vestido/:id', arrendamientoController.getArrendamientosByVestido);
router.put('/editar/:id', arrendamientoController.updateArrendamiento);
// router.post('/finalizar/:id', arrendamientoController.finalizarArrendamiento);
router.delete('/eliminar/:id', arrendamientoController.deleteArrendamiento);
module.exports = router;