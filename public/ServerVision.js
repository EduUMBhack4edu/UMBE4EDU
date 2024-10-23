let audioContext;
let audioPlayer;
let textDetected = '';
let isGoogleAPIsInitialized = false;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear el elemento de audio y agregarlo al DOM
    audioPlayer = document.createElement('audio');
    audioPlayer.controls = false; // Cambiado a false si ya no necesitas controles de audio
    document.body.appendChild(audioPlayer);
}

function initGoogleAPIs() {
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: 'AIzaSyDYa5nXG-swJVLnydCnCfpEln9SeCjn3as',
            discoveryDocs: [
                'https://content-vision.googleapis.com/$discovery/rest?version=v1',
                'https://texttospeech.googleapis.com/$discovery/rest?version=v1'
            ]
        }).then(() => {
            isGoogleAPIsInitialized = true;
            console.log('Google APIs initialized');
        }).catch(error => {
            console.error('Error initializing Google APIs:', error);
        });
    });
}

// Asegúrate de que este evento se registre después de que la página esté completamente cargada
window.onload = () => {
    document.getElementById('imageInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            initAudio();
            initGoogleAPIs();
            
            const checkAPIsInitialized = setInterval(() => {
                if (isGoogleAPIsInitialized) {
                    clearInterval(checkAPIsInitialized);
                    detectText(file);
                }
            }, 100);
        }
    });
};

function detectText(file) {
    const reader = new FileReader();
    reader.onload = async () => {
        const content = reader.result.split(',')[1];
        
        if (!gapi.client.vision) {
            console.error('Google Vision API not initialized');
            return;
        }
        
        const response = await gapi.client.vision.images.annotate({
            requests: [{
                image: { content },
                features: [{ type: 'TEXT_DETECTION' }]
            }]
        });

        const detections = response.result.responses[0].textAnnotations;
        if (detections && detections.length > 0) {
            textDetected = detections[0].description;
            console.log('Detected Text:', textDetected);
            synthesizeSpeech(textDetected);
        } else {
            console.error('No text detected');
        }
    };
    reader.readAsDataURL(file);
}

function synthesizeSpeech(text) {
    const request = {
        input: { text },
        voice: { languageCode: 'es-ES', name: 'es-ES-Standard-A' },
        audioConfig: { audioEncoding: 'MP3' }
    };

    gapi.client.texttospeech.text.synthesize(request).then((response) => {
        const audioContent = response.result.audioContent;
        if (audioContent) {
            const blob = new Blob([new Uint8Array(atob(audioContent).split("").map(c => c.charCodeAt(0)))], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        } else {
            console.error('Audio content not found');
        }
    }).catch(error => {
        console.error('Error synthesizing speech:', error);
    });
}
