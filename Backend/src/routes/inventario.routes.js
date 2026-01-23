const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Utilizar el middleware de upload desde el controlador
const upload = inventarioController.uploadMiddleware;

router.post('/crear', upload.single('imagen'), inventarioController.createInventario);
router.get('/listar', inventarioController.getInventarios);
router.get('/ver/:id', inventarioController.getInventarioById);
router.get('/imagen/:id', inventarioController.getInventarioImage);
router.put('/editar/:id', upload.single('imagen'), inventarioController.updateInventario);
router.delete('/eliminar/:id', inventarioController.deleteInventario);

module.exports = router;
