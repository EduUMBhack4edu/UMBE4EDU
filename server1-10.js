const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Asegúrate de importar el módulo path
const { SpeechClient } = require('@google-cloud/speech');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const upload = multer({ dest: 'uploads/' });

const client = new SpeechClient({ keyFilename: 'C:/Proyecto/spheric-engine-438101-r7-ae9eeedcb894.json' });

app.use(express.static('public')); // Sirve los archivos estáticos desde la carpeta 'public'

// Ruta para servir indexVision.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexVision.html'));
});

// Ruta para procesar el archivo de audio y enviarlo a la API de Google
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
    try {
        const audioFilePath = req.file.path; // Ruta del archivo de audio subido
        const wavFilePath = `uploads/${Date.now()}.wav`; // Nombre único basado en la marca de tiempo

        // Convierte el audio de WEBM a WAV
        await new Promise((resolve, reject) => {
            ffmpeg(audioFilePath)
                .audioFrequency(48000) // Asegúrate de que la frecuencia de muestreo sea 48000 Hz
                .toFormat('wav') // Formato de salida WAV
                .on('end', () => {
                    console.log('Conversión a WAV completada');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error en la conversión:', err);
                    reject(err);
                })
                .save(wavFilePath); // Guarda el archivo convertido en wavFilePath
        });

        // Leer el archivo de audio WAV y convertirlo a base64
        const audio = {
            content: fs.readFileSync(wavFilePath).toString('base64'), // Lee y convierte a base64
        };

        const config = {
            encoding: 'LINEAR16', // Formato WAV
            sampleRateHertz: 48000, // Cambiado a 48000
            languageCode: 'es-ES',
        };

        const request = {
            audio: audio,
            config: config,
        };

        // Llamada a la API de Google para obtener la transcripción
        const [response] = await client.recognize(request);
        const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

        // Enviar la transcripción como respuesta JSON
        res.json({ transcription });

        // Eliminar archivos temporales
        fs.unlinkSync(audioFilePath); // Eliminar archivo original
        fs.unlinkSync(wavFilePath); // Eliminar archivo convertido
    } catch (error) {
        console.error('Error al procesar el archivo:', error);
        res.status(500).json({ error: 'Error al procesar el archivo o la transcripción' });
    }
});

const port = 3003;
app.listen(port, () => {
    console.log(`Servidor Listo en http://localhost:${port}`);
});
