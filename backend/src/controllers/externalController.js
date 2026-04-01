const pool = require('../config/db');

const poblarProductos = async (request, response) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const apiFetch = await fetch('https://fakestoreapi.com/products');
        const products = await apiFetch.json();

        let inserciones = 0;

        for (const product of products) {
            const { title, price, description, image, category } = product;
            const stock = Math.floor(Math.random() * 50) + 1;

            const categoriaQuery = `
                INSERT INTO categoria (nombre)
                VALUES ($1)
                ON CONFLICT ON CONSTRAINT categoria_nombre_unique
                DO NOTHING
                RETURNING id;
            `;

            let categoriaResult = await client.query(categoriaQuery, [category]);

            let categoryId;

            if (categoriaResult.rows.length > 0) {
                categoryId = categoriaResult.rows[0].id;
            } else {
                const selectCategoria = `
                    SELECT id FROM categoria WHERE nombre = $1
                `;
                const existing = await client.query(selectCategoria, [category]);
                categoryId = existing.rows[0].id;
            }

            const productoQuery = `
                INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await client.query(productoQuery, [
                title,
                price,
                stock,
                description,
                image,
                categoryId
            ]);

            inserciones++;
        }

        await client.query('COMMIT');

        response.status(200).json({
            mensaje: "Carga masiva exitosa",
            cantidad: inserciones
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        response.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};


module.exports = { poblarProductos };