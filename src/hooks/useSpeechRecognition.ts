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
    recognition.continuous = false; 
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      // Si el usuario quiere seguir escuchando, reiniciamos inmediatamente
      if (shouldBeListening.current) {
        try {
          recognition.start();
        } catch (e) {
          console.warn("Failed to restart recognition:", e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        shouldBeListening.current = false;
      }
      // Otros errores como 'no-speech' son normales en modo no-continuo
    };
    
    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
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
    // En este nuevo modo, no hace falta reiniciar el micro manualmente
    // porque al ser continuous: false, se reinicia solo al terminar la frase.
  }, []);

  return { isListening, transcript, error, startListening, stopListening, resetTranscript, setTranscript };
}
