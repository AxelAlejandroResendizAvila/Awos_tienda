const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', productoController.getProductos);
router.post('/', authMiddleware, productoController.crearProducto);

module.exports = router;