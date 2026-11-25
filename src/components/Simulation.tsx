'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  MousePointerClick, 
  Edit3, 
  Download, 
  Clock, 
  CheckCircle2,
  PlayCircle 
} from 'lucide-react';
import type { SimulationStep } from '@/types';

interface SimulationProps {
  steps: SimulationStep[];
  isActive: boolean;
}

const getActionIcon = (action: string) => {
  const normalized = action.toLowerCase();
  
  if (normalized.includes('navigate') || normalized.includes('goto') || normalized.includes('page.')) {
    return <ArrowRight className="w-5 h-5" />;
  }
  if (normalized.includes('click') || normalized.includes('tap')) {
    return <MousePointerClick className="w-5 h-5" />;
  }
  if (normalized.includes('fill') || normalized.includes('type') || normalized.includes('input')) {
    return <Edit3 className="w-5 h-5" />;
  }
  if (normalized.includes('download') || normalized.includes('export')) {
    return <Download className="w-5 h-5" />;
  }
  if (normalized.includes('wait') || normalized.includes('timeout')) {
    return <Clock className="w-5 h-5" />;
  }
  
  return <PlayCircle className="w-5 h-5" />;
};

const getActionColor = (action: string): string => {
  const normalized = action.toLowerCase();
  if (normalized.includes('navigate')) return 'text-[#22d3ee]';
  if (normalized.includes('click')) return 'text-[#c026d3]';
  if (normalized.includes('fill') || normalized.includes('type')) return 'text-violet-400';
  if (normalized.includes('download')) return 'text-emerald-400';
  return 'text-white';
};

export default function Simulation({ steps, isActive }: SimulationProps) {
  if (steps.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <motion.div
          animate={{ 
            rotate: isActive ? [0, 360] : 0,
            scale: isActive ? [1, 1.15, 1] : 1 
          }}
          transition={{ duration: 2.2, repeat: isActive ? Infinity : 0 }}
        >
          <PlayCircle className="w-12 h-12 text-white/20 mx-auto mb-6" />
        </motion.div>
        <div className="text-white/40 text-sm max-w-[180px]">
          Simulation steps will animate here as the AI generates your automation
        </div>
        {isActive && (
          <div className="mt-8 flex items-center gap-2 text-xs text-accent">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
            THINKING
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative py-2">
      <div className="absolute left-8 top-3 bottom-6 w-[3px] bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
      
      <AnimatePresence>
        {steps.map((step, index) => (
          <motion.div
            key={`${step.action}-${index}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              delay: Math.min(index * 0.1, 0.8), 
              type: "spring", 
              stiffness: 120, 
              damping: 18 
            }}
            className="relative flex gap-6 mb-8 last:mb-0 group"
          >
            {/* Step Circle */}
            <div className="relative z-10">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`glass-highlight h-9 w-9 rounded-2xl flex items-center justify-center border border-white/20 bg-black/60 ${getActionColor(step.action)}`}
              >
                {getActionIcon(step.action)}
              </motion.div>
              
              {/* Completion check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-[10px] h-4 w-4 rounded-xl flex items-center justify-center border-2 border-[#0a0a0a]"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-baseline justify-between">
                <div className={`font-mono uppercase text-xs tracking-[0.5px] ${getActionColor(step.action)}`}>
                  {step.action}
                </div>
                <div className="text-white/30 text-xs font-mono">STEP {String(index + 1).padStart(2, '0')}</div>
              </div>
              
              <div className="text-[13.5px] leading-tight text-white mt-1 pr-4">
                {step.description}
              </div>
              
              {(step.selector || step.target) && (
                <div className="mt-3 font-mono text-[10px] bg-white/5 border border-white/10 px-3 py-2 rounded-2xl text-white/60 overflow-hidden text-ellipsis whitespace-nowrap">
                  {step.selector || step.target}
                </div>
              )}
              
              {step.value && (
                <div className="mt-2 inline-flex items-center rounded-3xl bg-white/5 px-3 py-1 text-xs text-white/70">
                  <span className="text-white/40 mr-1">→</span> 
                  &ldquo;{step.value}&rdquo;
                </div>
              )}
            </div>

            {/* Hover accent */}
            <div className="absolute -inset-x-4 -inset-y-2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-10 transition-all rounded-3xl bg-gradient-to-r from-[#c026d3] to-[#22d3ee] pointer-events-none" />
          </motion.div>
        ))}
      </AnimatePresence>

      {isActive && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 right-4 glass text-xs px-4 py-2 rounded-3xl flex items-center gap-2 text-accent border border-accent/30"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          SIMULATING
        </motion.div>
      )}
    </div>
  );
}
