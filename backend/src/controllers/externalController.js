const pool = require('../config/db');
const DUMMYJSON_URL = 'https://dummyjson.com/products?limit=20';
const obtenerProductosExternos = async () => {
    const apiResponse = await fetch(DUMMYJSON_URL);
    if (!apiResponse.ok) {
        throw new Error(`DummyJSON respondió con estado ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return products.map((p) => ({
        title: p.title,
        price: p.price,
        description: p.description,
        image: p.thumbnail,
        category: p.category
    }));
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
            const categoriaResult = await client.query(
                `INSERT INTO categorias (nombre)
                 VALUES ($1)
                 ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
                 RETURNING id`,
                [category]
            );
            const categoryId = categoriaResult.rows[0].id;

            const productoQuery = `
                INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                SELECT $1, $2, $3, $4, $5, $6
                WHERE NOT EXISTS (
                    SELECT 1 FROM productos WHERE nombre = $1
                )
            `;

            const insertProducto = await client.query(productoQuery, [
                nombreProducto,
                price,
                stock,
                description,
                image,
                categoryId
            ]);
            if (insertProducto.rowCount > 0) inserciones++;
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