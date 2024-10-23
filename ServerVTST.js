const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir archivos estáticos desde el directorio public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
