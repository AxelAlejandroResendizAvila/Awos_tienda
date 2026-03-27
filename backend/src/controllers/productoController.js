const pool = require('../config/db');

const getProductos = async (req, res) => {
    try {
        const query = `SELECT * FROM productos ORDER BY id ASC`;
        const response = await pool.query(query);
        res.json(response.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar productos' });
    }
};

const crearProducto = async (req, res) => {
    const { nombre, precio, stock, descripcion, imagen_url, id_categoria, youtube_id, latitud, longitud } = req.body;

    try {
        if (!nombre || !precio || !id_categoria) {
            return res.status(400).json({ msg: "Nombre, precio y categoría son obligatorios" });
        }

        const query = `
            INSERT INTO productos ( nombre, precio, stock, descripcion, imagen_url, id_categoria, youtube_id, latitud, longitud )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;

        const response = await pool.query(query, [
            nombre, precio, stock || 0, descripcion || '', imagen_url || '', id_categoria, youtube_id || null, latitud || 20.586515, longitud || -100.3901229
        ]);

        res.status(201).json({
            msg: "Producto creado con éxito",
            producto: response.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

module.exports = { getProductos, crearProducto };