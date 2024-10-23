const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');
const cors = require('cors');
const path = require('path');

// Cargar las credenciales de Google Cloud
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/Proyecto/spheric-engine-438101-r7-ae9eeedcb894.json';

// Inicializar cliente Text-to-Speech
const client = new textToSpeech.TextToSpeechClient();

const app = express();
app.use(cors()); // Habilitar CORS para permitir solicitudes del frontend
app.use(bodyParser.json());
app.use(express.static('public')); // Para servir los archivos estáticos

// Ruta para servir el archivo indexCuento.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexCuento.html'));
});

// Ruta para convertir texto a audio
app.post('/api/convert', async (req, res) => {
  const text = req.body.text;

  const request = {
    input: { text: text },
    voice: { languageCode: 'es-ES', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    const outputPath = 'public/output.mp3';
    
    // Guardar el archivo de audio en la carpeta pública
    await writeFile(outputPath, response.audioContent, 'binary');
    
    // Devolver la URL del archivo de audio
    res.json({ audioUrl: '/output.mp3' });
  } catch (error) {
    res.status(500).send('Error al convertir el texto en audio: ' + error.message);
  }
});

const port = 3002;
app.listen(port, () => {
  console.log(`Servidor Listo en: http://localhost:${port}`);
});
