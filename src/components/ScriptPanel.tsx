'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, FileText, Play } from 'lucide-react';
import type { ScriptRecipe } from '@/types';

interface ScriptPanelProps {
  code: string;
  title?: string;
  onCopy: () => void;
  onDownload: () => void;
}

export default function ScriptPanel({
  code,
  title = 'Generated Script',
  onCopy,
  onDownload,
}: ScriptPanelProps) {
  const handleCopy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    onCopy();
  }, [code, onCopy]);

  const handleDownloadClick = useCallback(() => {
    if (!code) return;
    onDownload();
  }, [code, onDownload]);

  const displayedTitle = title.length > 28 
    ? title.substring(0, 25) + '...' 
    : title;

  return (
    <div className="flex h-full flex-col">
      {/* Panel Header */}
      <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="glass-highlight h-7 w-7 rounded-2xl bg-gradient-to-br from-[#c026d3] to-[#22d3ee] flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-sm tracking-tight">{displayedTitle}</div>
            <div className="text-[10px] text-white/40 -mt-0.5 font-mono">playwright.spec.ts</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            disabled={!code}
            className="glass flex h-8 w-8 items-center justify-center rounded-2xl text-white/70 hover:text-white transition-colors focus-ring disabled:opacity-40"
            aria-label="Copy script"
          >
            <Copy className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadClick}
            disabled={!code}
            className="glass flex h-8 w-8 items-center justify-center rounded-2xl text-white/70 hover:text-white transition-colors focus-ring disabled:opacity-40"
            aria-label="Download script"
          >
            <Download className="w-4 h-4" />
          </motion.button>

          <motion.a
            href="https://playwright.dev/docs/intro"
            target="_blank"
            className="glass text-accent flex items-center gap-1.5 px-3 text-xs h-8 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            RUN
          </motion.a>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 relative bg-[#0a0a0a] flex flex-col min-h-0">
        {code ? (
          <>
            <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
              <div className="px-2.5 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                TS
              </div>
            </div>

            <pre className="flex-1 p-6 pt-10 overflow-auto text-sm leading-relaxed code-font text-slate-200 custom-scroll">
              <code>{code}</code>
            </pre>

            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-3 left-6 text-[10px] font-mono text-white/30 flex items-center gap-3">
              <div>Best-practice selectors</div>
              <div className="w-px h-2 bg-white/20" />
              <div>Commented steps</div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center px-8">
            <div className="glass rounded-3xl p-8 w-full max-w-[260px]">
              <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white/30" />
              </div>
              <div className="text-white/40 text-sm leading-snug">
                Your Playwright script appears here.<br />
                Complete with comments and robust selectors.
              </div>
              <div className="mt-8 text-[10px] text-white/20 font-mono border border-white/10 rounded-2xl py-2">
                await page.getByRole(&#39;button&#39;, &#123; name: /login/i &#125;)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {code && (
        <div className="h-9 border-t border-white/10 bg-black/60 flex items-center px-6 text-[10px] text-white/30 font-mono">
          Generated with llama3.1 • Ready for npx playwright test
        </div>
      )}
    </div>
  );
}
