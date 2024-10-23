const express = require('express');
const bodyParser = require('body-parser');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const speech = require('@google-cloud/speech');
const path = require('path'); // Importar el módulo path

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Cargar las credenciales de Google Cloud
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/Proyecto/spheric-engine-438101-r7-ae9eeedcb894.json';
const textToSpeechClient = new textToSpeech.TextToSpeechClient();
const speechClient = new speech.SpeechClient();

// Ruta para servir index_Audiometria.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index_Audiometria.html')); // Sirve el archivo index_Audiometria.html
});

// Ruta para la prueba de audiometría
app.get('/api/audiometry', (req, res) => {
    res.json({ message: 'Prueba de audiometría iniciada. Por favor, complete la prueba antes de proceder.' });
});

// Ruta para convertir texto a audio
app.post('/api/convert', async (req, res) => {
    const text = req.body.exercise;

    const request = {
        input: { text: text },
        voice: { languageCode: 'es-ES', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const [response] = await textToSpeechClient.synthesizeSpeech(request);
        const outputPath = 'public/exercise.mp3';
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(outputPath, response.audioContent, 'binary');
        res.json({ audioUrl: '/exercise.mp3' });
    } catch (error) {
        res.status(500).send('Error al convertir el texto en audio: ' + error.message);
    }
});

// Ruta para procesar la respuesta de grabación
app.post('/api/answer', upload.single('audio'), async (req, res) => {
    const audioFilePath = req.file.path; // Ruta del archivo subido
    console.log(`Archivo de audio subido a: ${audioFilePath}`);

    // Leer el archivo de audio y transcribirlo
    const file = fs.readFileSync(audioFilePath);
    const audioBytes = file.toString('base64');

    const audio = {
        content: audioBytes,
    };

    const config = {
        encoding: 'WEBM_OPUS', // Cambiado a 'WEBM_OPUS' para el formato de audio
        sampleRateHertz: 48000, // Ajustado a 48000 Hz
        languageCode: 'es-ES', // Cambia según el idioma
    };

    const request = {
        audio: audio,
        config: config,
    };

    try {
        const [response] = await speechClient.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n'); // Unir todas las transcripciones

        res.json({ transcription: transcription }); // Devolver la transcripción real
    } catch (error) {
        console.error('Error al transcribir el audio:', error);
        res.status(500).send('Error al transcribir el audio: ' + error.message);
    }
});

// Cambia el puerto a 3001
const port = 3001;
app.listen(port, () => {
    console.log(`Servicio listo en http://localhost:${port}`);
});