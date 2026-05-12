import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { translate } from '../lib/gemini';
import { rtdb } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';

export function VoiceTranslator({ isOverlay = false }: { isOverlay?: boolean }) {
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [fontSize, setFontSize] = useState(48);
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

  // Sincronización en la Nube vía Firebase Realtime Database (RTDB)
  useEffect(() => {
    const syncRef = ref(rtdb, 'overlay/current');
    
    // El overlay se suscribe a los cambios en tiempo real
    if (isOverlay) {
      const unsubscribe = onValue(syncRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.text !== undefined) setTranslation(data.text);
          if (data.isTranslating !== undefined) setIsTranslating(data.isTranslating);
          if (data.fontSize !== undefined) setFontSize(data.fontSize);
        }
      });
      return () => unsubscribe();
    }
  }, [isOverlay]);

  useEffect(() => {
    if (isOverlay) return; // El overlay no traduce, solo recibe

    const processTranslation = async () => {
      if (transcript && transcript.length > 5 && transcript !== lastProcessedTranscript.current && !isTranslating) {
        setIsTranslating(true);
        const syncRef = ref(rtdb, 'overlay/current');
        
        // Notificar inicio de traducción a OBS
        await update(syncRef, {
          isTranslating: true,
          updatedAt: Date.now()
        });
        
        lastProcessedTranscript.current = transcript;
        
        try {
          const result = await translate(transcript, 'English', 'natural, casual, persuasive');
          
          setTranslation(result);
          
          // Enviamos la traducción final al overlay vía RTDB
          await update(syncRef, {
            text: result,
            isTranslating: false,
            updatedAt: Date.now(),
            fontSize: fontSize
          });

          // Una vez traducido, reseteamos el buffer de voz para la siguiente frase
          resetTranscript();
        } catch (err: any) {
          console.error("Translation processing error:", err);
          await update(syncRef, { isTranslating: false });
        } finally {
          setIsTranslating(false);
        }
      }
    };

    // Debounce de 1.2 segundos: solicitado para no perder contexto en pausas cortas
    const timer = setTimeout(processTranslation, 1200);
    return () => clearTimeout(timer);
  }, [transcript, fontSize, isOverlay, isTranslating, resetTranscript]);

  const updateFontSize = async (newSize: number) => {
    setFontSize(newSize);
    if (!isOverlay) {
      const syncRef = ref(rtdb, 'overlay/current');
      // Usamos update para que sea un cambio parcial suave
      await update(syncRef, { fontSize: newSize });
    }
  };

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
              <p 
                className="font-display font-bold text-white tracking-tight leading-tight relative"
                style={{ fontSize: `${fontSize}px` }}
              >
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

        {/* Font Size Control */}
        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Font Size</span>
          <input 
            type="range" 
            min="24" 
            max="120" 
            value={fontSize} 
            onChange={(e) => updateFontSize(parseInt(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span className="text-sm font-mono text-white/60 w-12 text-right">{fontSize}px</span>
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
