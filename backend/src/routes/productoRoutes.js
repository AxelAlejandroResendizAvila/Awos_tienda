const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const externalController = require('../controllers/externalController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', productoController.getProductos);
router.post('/', authMiddleware, productoController.crearProducto);
router.post('/poblar', externalController.poblarProductos);

module.exports = router;