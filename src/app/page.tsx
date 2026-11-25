'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PlayCircle, Copy, Download, Bot, RefreshCw, Trash2 } from 'lucide-react';
import PromptInput from '@/components/PromptInput';
import Simulation from '@/components/Simulation';
import ScriptPanel from '@/components/ScriptPanel';
import Gallery from '@/components/Gallery';
import type { ScriptRecipe, SimulationStep, ChatMessage } from '@/types';

export default function WebmancerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<ScriptRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contextUrl, setContextUrl] = useState<string>('https://example.com/dashboard');

  const handleGenerate = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: contextUrl ? `Current page: ${contextUrl}` : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const recipe: ScriptRecipe = {
        id: `recipe_${Date.now()}`,
        title: data.title || 'Automation Script',
        code: data.code || '// Generated Playwright script would appear here',
        steps: data.steps || [],
        tags: ['new', 'playwright'],
        createdAt: new Date(),
      };

      setCurrentRecipe(recipe);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.explanation || 'Script generated successfully. Review the simulation and code on the right. You can refine it by describing changes below.',
        timestamp: new Date(),
        recipeId: recipe.id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Generation failed:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I could not reach the local Ollama instance. Make sure Ollama is running with a model pulled (e.g. llama3).',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [contextUrl]);

  const handleRefine = useCallback(async (feedback: string) => {
    if (!currentRecipe) return;
    
    setIsLoading(true);
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: `Refine the previous script: ${feedback}`,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: feedback,
          script: currentRecipe.code,
          isRefinement: true,
        }),
      });

      const data = await response.json();

      const refinedRecipe: ScriptRecipe = {
        ...currentRecipe,
        code: data.code || currentRecipe.code,
        steps: data.steps || currentRecipe.steps,
        updatedAt: new Date(),
      };

      setCurrentRecipe(refinedRecipe);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Script refined based on your feedback.',
        timestamp: new Date(),
        recipeId: refinedRecipe.id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentRecipe]);

  const handleCopyScript = useCallback(() => {
    if (!currentRecipe?.code) return;
    navigator.clipboard.writeText(currentRecipe.code);
  }, [currentRecipe]);

  const handleDownload = useCallback(() => {
    if (!currentRecipe?.code) return;
    
    const blob = new Blob([currentRecipe.code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentRecipe.title || 'script').toLowerCase().replace(/\s+/g, '-')}.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentRecipe]);

  // Demo content on first load
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content: 'Hi! Describe a browser task and I will turn it into a clean Playwright script using local AI. Try: "Log into the demo site, navigate to products, and export the CSV."',
            timestamp: new Date(Date.now() - 100000),
          },
        ]);
      }, 420);
    }
  }, []);

  return (
    <div className="mesh-bg min-h-screen text-white overflow-hidden relative">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      <div className="relative z-10 flex h-screen">
        {/* Gallery Sidebar */}
        <div className="w-72 border-r border-white/10 bg-black/30 flex flex-col">
          <div className="h-16 border-b border-white/10 flex items-center px-6 font-semibold tracking-tight">
            <div className="flex items-center gap-2">
              <div className="text-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              GALLERY
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <Gallery />
          </div>
          <div className="p-4 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between">
            <div>12 recipes saved locally</div>
            <button 
              onClick={() => {/* clear all */}}
              className="hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 glass border-b border-white/10 px-8 flex items-center justify-between">
            <div className="flex items-center gap-x-4">
              {/* Animated Orb Logo */}
              <motion.div
                className="orb-glow w-8 h-8 rounded-2xl bg-gradient-to-br from-[#c026d3] to-[#22d3ee] flex items-center justify-center relative overflow-hidden"
                animate={{ 
                  rotate: [0, 12, -8, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 5.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <div className="absolute inset-0 bg-white/30 mix-blend-overlay" />
                <Sparkles className="w-4 h-4 text-white relative z-10" />
              </motion.div>
              
              <div>
                <div className="text-3xl font-bold tracking-[-2px] neon-text">webmancer</div>
                <div className="text-[10px] text-white/40 -mt-1 font-mono">LOCAL AI → PLAYWRIGHT</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 text-white/70 text-xs px-3 py-1 rounded-3xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                llama3.1 running on Ollama
              </div>

              <button 
                className="flex items-center gap-2 px-5 py-2 rounded-3xl glass text-xs hover:bg-white/10 transition-all active:scale-95"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                NEW TASK
              </button>
            </div>
          </header>

          {/* Messages / History */}
          <div className="flex-1 overflow-auto p-8 space-y-9 custom-scroll">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl glass rounded-3xl px-7 py-5 text-[15px] leading-relaxed ${
                      message.role === 'user' 
                        ? 'chat-bubble-user rounded-tr-none' 
                        : 'rounded-tl-none'
                    } ${message.isError ? 'border-red-400/40' : ''}`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {messages.length < 2 && (
              <div className="pt-12 flex flex-col items-center justify-center text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 mb-8">
                  <Bot className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-4xl font-semibold tracking-tight mb-3 text-white">
                  What are we automating?
                </h2>
                <p className="max-w-xs text-white/50 text-sm">
                  Natural language → complete Playwright TypeScript test.<br />Everything stays on-device.
                </p>
              </div>
            )}
          </div>

          {/* Prompt Area */}
          <div className="px-8 pb-8 pt-2 border-t border-white/10 bg-black/30">
            <PromptInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
              onRefine={handleRefine}
              hasRecipe={!!currentRecipe}
            />
          </div>
        </div>

        {/* Right Sidebar: Simulation + Script */}
        <div className="w-96 border-l border-white/10 bg-black/40 flex flex-col">
          {/* Simulation Header */}
          <div className="h-14 border-b border-white/10 px-6 flex items-center text-sm font-medium tracking-wider">
            <PlayCircle className="mr-2 text-accent" />
            LIVE SIMULATION
          </div>

          <div className="flex-1 p-5 overflow-auto bg-black/20">
            <Simulation 
              steps={currentRecipe?.steps || []} 
              isActive={isLoading}
            />
            
            {!currentRecipe && (
              <div className="h-full flex items-center justify-center text-center">
                <div className="text-white/30 text-sm max-w-[190px]">
                  Your step-by-step visual preview will appear here after generation
                </div>
              </div>
            )}
          </div>

          {/* Script Panel */}
          <div className="border-t border-white/10 flex flex-col flex-shrink-0" style={{ height: '42%' }}>
            <ScriptPanel 
              code={currentRecipe?.code || ''}
              title={currentRecipe?.title}
              onCopy={handleCopyScript}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
