const pool = require('./src/config/db');

const poblarBaseDeDatos = async () => {
    try {
        console.log("⏳ Consumiendo FakeStore API...");

        // Usamos el fetch nativo de Node.js para traer 20 productos de prueba
        const response = await fetch('https://fakestoreapi.com/products');
        const productosFake = await response.json();

        console.log(`Se descargaron ${productosFake.length} productos. Insertando en PostgreSQL...`);

        // Recorremos el arreglo e insertamos uno por uno en nuestra base de datos
        for (const prod of productosFake) {
            const query = `
                INSERT INTO productos (nombre, precio, stock, descripcion, imagen_url, categoria_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            // Mapeamos los datos de FakeStore a nuestra estructura
            const valores = [
                prod.title.substring(0, 250), // Aseguramos que no pase el límite del VARCHAR
                prod.price,
                Math.floor(Math.random() * 50) + 1, // Inventamos un stock aleatorio entre 1 y 50
                prod.description,
                prod.image,
                1 // Asignamos una categoría por defecto
                // Nota: Dejamos youtube_id en blanco (null) para que tus alumnos lo llenen en clase
            ];

            await pool.query(query, valores);
        }

        console.log("🎉 ¡Inventario poblado exitosamente!");
        process.exit(0); // Cerramos el script correctamente
    } catch (error) {
        console.error("Error al poblar la base de datos:", error);
        process.exit(1);
    }
};

poblarBaseDeDatos();