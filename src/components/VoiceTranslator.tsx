import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { translate } from '../lib/gemini';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export function VoiceTranslator({ isOverlay = false }: { isOverlay?: boolean }) {
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const lastProcessedTranscript = useRef('');

  // En modo overlay, NO iniciamos el micro. Solo escuchamos mensajes.
  useEffect(() => {
    if (isOverlay && isListening) {
      stopListening();
    }
  }, [isOverlay, isListening, stopListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Sincronización con Firebase
  useEffect(() => {
    const docRef = doc(db, 'overlay_data', 'current_translation');
    
    // El overlay se suscribe a los cambios
    if (isOverlay) {
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTranslation(data.text || '');
          setIsTranslating(data.isTranslating || false);
        }
      }, (error) => {
        console.error("Firestore subscription error:", error);
      });
      return () => unsubscribe();
    }
  }, [isOverlay]);

  useEffect(() => {
    if (isOverlay) return; // El overlay no traduce, solo recibe

    const processTranslation = async () => {
      if (transcript && transcript.length > 5 && transcript !== lastProcessedTranscript.current) {
        setIsTranslating(true);
        
        // Notificar inicio de traducción a Firebase
        const docRef = doc(db, 'overlay_data', 'current_translation');
        await setDoc(docRef, { 
          isTranslating: true,
          updatedAt: Date.now() 
        }, { merge: true });
        
        lastProcessedTranscript.current = transcript;
        setTranslation(''); 
        
        try {
          const result = await translate(transcript, 'English', 'natural, casual, persuasive');
          
          setTranslation(result);
          
          // Actualizar traducción en Firebase
          await setDoc(docRef, { 
            text: result,
            isTranslating: false,
            updatedAt: Date.now() 
          });

          // Una vez traducido, reseteamos el buffer de voz para la siguiente frase
          resetTranscript();
        } catch (err) {
          console.error("Translation processing error:", err);
          await setDoc(docRef, { isTranslating: false }, { merge: true });
        } finally {
          setIsTranslating(false);
        }
      }
    };

    // Debounce de 2 segundos: solo traduce cuando el usuario deja de hablar
    const timer = setTimeout(processTranslation, 2000);
    return () => clearTimeout(timer);
  }, [transcript]);

  if (isOverlay) {
    return (
      <div className="w-full max-w-4xl text-center">
        <AnimatePresence mode="wait">
          {translation ? (
            <motion.div
              key={translation}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-8 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0px rgba(0,0,0,0.8), 1px -1px 0px rgba(0,0,0,0.8), -1px 1px 0px rgba(0,0,0,0.8), 1px 1px 0px rgba(0,0,0,0.8)'
              }}
            >
              <p className="text-5xl font-display font-bold text-white tracking-tight leading-tight relative">
                {translation}
                {isTranslating && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -right-8 top-0 w-2 h-2 bg-white rounded-full"
                  />
                )}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-3 h-3 bg-white rounded-full"
                />
              </div>
              <div className="text-white/20 font-mono text-sm uppercase tracking-[0.2em]">
                Waiting for Clique Controller...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-bold tracking-tight">Voice Assistant</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Real-time Speech to English</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-[8px] font-mono text-blue-400 uppercase tracking-tight">Sync Active</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleListening}
            className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 ${
              isListening 
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {isListening ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-white/20 rounded-full"
                />
                <Mic className="w-6 h-6 relative z-10" />
              </>
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[200px]">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Transcription (ES)</span>
            <p className="text-2xl font-light text-white/60 leading-snug">
              {transcript || <span className="text-white/5 italic">Empieza a hablar para transcribir...</span>}
            </p>
          </div>

          <div className="flex flex-col gap-4 border-l border-white/5 pl-12">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Translation (EN)</span>
              {isTranslating && <RefreshCw className="w-3 h-3 text-white/20 animate-spin" />}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={translation}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-display font-medium text-white leading-tight tracking-tight"
              >
                {translation || <span className="text-white/5 italic">Waiting for speech...</span>}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
