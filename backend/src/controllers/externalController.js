const pool = require('../config/db');
const https = require('https');

const obtenerProductosFakeStore = async () => {
    if (typeof fetch === 'function') {
        const apiFetch = await fetch('https://fakestoreapi.com/products');
        if (!apiFetch.ok) {
            throw new Error(`FakeStore respondió con estado ${apiFetch.status}`);
        }
        return apiFetch.json();
    }

    return new Promise((resolve, reject) => {
        https
            .get('https://fakestoreapi.com/products', (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`FakeStore respondió con estado ${res.statusCode}`));
                    }

                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error('No se pudo parsear la respuesta de FakeStore'));
                    }
                });
            })
            .on('error', (err) => reject(err));
    });
};

const poblarProductos = async (request, response) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const products = await obtenerProductosFakeStore();

        let inserciones = 0;

        for (const product of products) {
            const { title, price, description, image, category } = product;
            const stock = Math.floor(Math.random() * 50) + 1;
            const nombreProducto = title.substring(0, 250);

            let categoryId;

            const selectCategoria = `
                SELECT id FROM categorias WHERE nombre = $1 LIMIT 1
            `;
            const existingCategory = await client.query(selectCategoria, [category]);

            if (existingCategory.rows.length > 0) {
                categoryId = existingCategory.rows[0].id;
            } else {
                const insertCategoria = `
                    INSERT INTO categorias (nombre)
                    VALUES ($1)
                    RETURNING id
                `;
                const categoriaResult = await client.query(insertCategoria, [category]);
                categoryId = categoriaResult.rows[0].id;
            }

            const existeProducto = await client.query(
                'SELECT id FROM productos WHERE nombre = $1 LIMIT 1',
                [nombreProducto]
            );
            if (existeProducto.rows.length > 0) continue;

            const productoQuery = `
                INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await client.query(productoQuery, [
                nombreProducto,
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