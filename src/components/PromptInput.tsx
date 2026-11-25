'use client';

import React, { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromptInputProps {
  onGenerate: (prompt: string) => Promise<void>;
  onRefine?: (feedback: string) => Promise<void>;
  isLoading?: boolean;
  hasRecipe?: boolean;
  placeholder?: string;
}

export default function PromptInput({
  onGenerate,
  onRefine,
  isLoading = false,
  hasRecipe = false,
  placeholder = "Describe your browser task in plain English...",
}: PromptInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const trimmed = inputValue.trim();
    setInputValue('');

    if (hasRecipe && onRefine) {
      await onRefine(trimmed);
    } else {
      await onGenerate(trimmed);
    }

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '54px';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, 160);
    ta.style.height = `${newHeight}px`;
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="glass rounded-3xl p-2 shadow-glass border border-white/10 focus-within:border-[#22d3ee]/40 transition-all">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="code-font w-full bg-transparent px-6 py-5 text-[15px] placeholder:text-white/40 resize-none focus:outline-none pr-20 leading-relaxed"
            style={{ height: '54px' }}
            disabled={isLoading}
          />

          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            {hasRecipe && (
              <div className="text-[10px] px-3 py-1 rounded-3xl bg-white/10 text-white/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                REFINING
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="h-10 w-10 flex items-center justify-center bg-gradient-to-br from-[#c026d3] to-[#22d3ee] disabled:from-zinc-700 disabled:to-zinc-600 rounded-2xl text-white shadow-neon transition-all focus-ring"
              aria-label="Send prompt"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 -rotate-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <div className="text-center text-[10px] text-white/30 flex items-center gap-5">
          <div>Local-first • Private</div>
          <div className="w-px h-2.5 bg-white/20" />
          <div>Powered by Ollama + Playwright</div>
        </div>
      </div>
    </motion.form>
  );
}
