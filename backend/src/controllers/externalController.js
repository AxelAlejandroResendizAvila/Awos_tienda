const pool = require('../config/db');
const https = require('https');
const FAKESTORE_URL = 'https://fakestoreapi.com/products?limit=20';
const DUMMYJSON_URL = 'https://dummyjson.com/products?limit=20';
const REQUEST_HEADERS = {
    'User-Agent': 'awos-tienda-backend/1.0',
    'Accept': 'application/json'
};

const fetchJson = async (url) => {
    if (typeof fetch === 'function') {
        const apiFetch = await fetch(url, { headers: REQUEST_HEADERS });
        if (!apiFetch.ok) {
            throw new Error(`API respondió con estado ${apiFetch.status}`);
        }
        return apiFetch.json();
    }

    return new Promise((resolve, reject) => {
        const request = https.request(url, { method: 'GET', headers: REQUEST_HEADERS }, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`API respondió con estado ${res.statusCode}`));
                    }

                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error('No se pudo parsear la respuesta de FakeStore'));
                    }
                });
            });

        request.on('error', (err) => reject(err));
        request.end();
    });
};

const obtenerProductosExternos = async () => {
    try {
        const fakeStore = await fetchJson(FAKESTORE_URL);
        return fakeStore.map((p) => ({
            title: p.title,
            price: p.price,
            description: p.description,
            image: p.image,
            category: p.category
        }));
    } catch (firstError) {
        try {
            const dummy = await fetchJson(DUMMYJSON_URL);
            const items = Array.isArray(dummy.products) ? dummy.products : [];
            return items.map((p) => ({
                title: p.title,
                price: p.price,
                description: p.description,
                image: p.thumbnail,
                category: p.category
            }));
        } catch (secondError) {
            throw new Error(`No se pudieron obtener productos externos. FakeStore: ${firstError.message}. DummyJSON: ${secondError.message}`);
        }
    }
};

const poblarProductos = async (request, response) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const products = await obtenerProductosExternos();

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