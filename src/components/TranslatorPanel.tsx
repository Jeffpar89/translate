import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, RefreshCw, Send } from 'lucide-react';
import { translate } from '../lib/gemini';

interface TranslatorPanelProps {
  title: string;
  sourceLang: string;
  targetLang: string;
  placeholder: string;
  isAutoTranslate?: boolean;
}

export function TranslatorPanel({ title, sourceLang, targetLang, placeholder, isAutoTranslate = true }: TranslatorPanelProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async (text: string) => {
    if (!text.trim()) {
      setOutput('');
      return;
    }
    setIsTranslating(true);
    const result = await translate(text, targetLang);
    setOutput(result);
    setIsTranslating(false);
  };

  useEffect(() => {
    if (isAutoTranslate) {
      const timer = setTimeout(() => {
        handleTranslate(input);
      }, 400); // Reducido de 800ms a 400ms para mayor velocidad
      return () => clearTimeout(timer);
    }
  }, [input, isAutoTranslate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
        <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-white/40">{title}</h3>
        <div className="flex gap-2">
          <span className="px-2 py-1 text-[10px] font-mono bg-white/5 rounded text-white/60 uppercase">{sourceLang}</span>
          <span className="text-white/20">→</span>
          <span className="px-2 py-1 text-[10px] font-mono bg-white/10 rounded text-white/90 uppercase">{targetLang}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-white/30">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-lg font-light resize-none focus:outline-none placeholder:text-white/10 text-white/90 leading-relaxed"
          />
        </div>

        <div className="h-px bg-white/5 w-full" />

        <div className="flex-1 flex flex-col gap-2 relative">
          <label className="text-[10px] font-mono uppercase tracking-wider text-white/30">Translation</label>
          <div className="flex-1 text-lg font-light text-white/90 leading-relaxed overflow-y-auto">
            {isTranslating ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-white/20 italic"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Translating...
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.p
                  key={output}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={output ? "text-white" : "text-white/10 italic"}
                >
                  {output || "Resultado aparecerá aquí..."}
                </motion.p>
              </AnimatePresence>
            )}
          </div>

          {output && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={copyToClipboard}
              className="absolute bottom-0 right-0 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
