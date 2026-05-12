import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldBeListening = useRef(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    // Usamos continuous: false para que el navegador nos dé frases individuales
    // y se detenga automáticamente al detectar un silencio largo.
    // Nosotros lo reiniciaremos manualmente para mantenerlo "siempre encendido".
    recognition.continuous = true; 
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      // Si el usuario quiere seguir escuchando, reiniciamos (auto-restart para modo siempre encendido)
      if (shouldBeListening.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ya está encendido o error normal
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        shouldBeListening.current = false;
      }
    };
    
    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };

    try {
      shouldBeListening.current = true;
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListening.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    // Forzamos un reinicio de la sesión de reconocimiento para "limpiar el buffer" interno de la API
    if (recognitionRef.current && shouldBeListening.current) {
      try {
        recognitionRef.current.stop();
        // El reset real ocurrirá en onend -> start()
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  return { isListening, transcript, error, startListening, stopListening, resetTranscript, setTranscript };
}
