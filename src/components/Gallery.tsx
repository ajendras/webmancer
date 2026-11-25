'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Trash2, 
  Calendar, 
  Play, 
  Tag,
  Plus 
} from 'lucide-react';
import type { ScriptRecipe, SimulationStep } from '@/types';

interface GalleryStore {
  recipes: ScriptRecipe[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  addRecipe: (recipe: ScriptRecipe) => void;
  deleteRecipe: (id: string) => void;
}

const useGalleryStore = create<GalleryStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      searchTerm: '',
      setSearchTerm: (term) => set({ searchTerm: term }),
      addRecipe: (recipe) => 
        set((state) => ({
          recipes: [recipe, ...state.recipes],
        })),
      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'webmancer-gallery',
      partialize: (state) => ({ recipes: state.recipes }),
    }
  )
);

// Demo recipes for first-time users
const createDemoRecipes = (): ScriptRecipe[] => {
  const now = new Date();
  
  const demoSteps1: SimulationStep[] = [
    { action: 'navigate', description: 'Go to the company login page', selector: 'https://demo.app/login' },
    { action: 'fill', description: 'Enter username', selector: '[data-testid="username"]', value: 'demo-user' },
    { action: 'fill', description: 'Enter password', selector: '[data-testid="password"]', value: '••••••••' },
    { action: 'click', description: 'Submit login form', selector: 'button:has-text("Sign in")' },
    { action: 'navigate', description: 'Navigate to reports dashboard', selector: '/reports' },
    { action: 'click', description: 'Export latest CSV report', selector: '[aria-label="Export CSV"]' },
  ];

  const demoSteps2: SimulationStep[] = [
    { action: 'navigate', description: 'Open the product catalog', selector: 'https://example.com/products' },
    { action: 'click', description: 'Filter by category: Electronics', selector: 'button#category-electronics' },
    { action: 'wait', description: 'Wait for results to load', selector: '2s' },
    { action: 'click', description: 'Add first three items to comparison', selector: '.product-card >> nth=0' },
  ];

  return [
    {
      id: 'demo-1',
      title: 'Login and export quarterly report',
      code: `// webmancer-generated - login-and-export.spec.ts
import { test, expect } from '@playwright/test';

test('login and export quarterly report', async ({ page }) => {
  // Navigate to login
  await page.goto('https://demo.app/login');
  
  // Fill credentials using robust selectors
  await page.getByTestId('username').fill('demo-user');
  await page.getByTestId('password').fill('demo-pass-2024');
  
  // Submit and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard**'),
    page.getByRole('button', { name: /sign in/i }).click()
  ]);
  
  // Export the latest report
  await page.getByRole('button', { name: /export csv/i }).click();
  
  // Verify download started
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Q3 Financials').click();
  const download = await downloadPromise;
  await download.saveAs('quarterly-report.csv');
  
  console.log('✅ Report exported successfully');
});`,
      steps: demoSteps1,
      tags: ['login', 'export', 'reporting'],
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4),
    },
    {
      id: 'demo-2',
      title: 'Product catalog scraper',
      code: `// webmancer-generated - catalog-scrape.spec.ts
import { test, expect } from '@playwright/test';

test('scrape product catalog', async ({ page }) => {
  await page.goto('https://example.com/products');
  
  // Filter products
  await page.getByRole('button', { name: 'Electronics' }).click();
  await page.waitForLoadState('networkidle');
  
  const products = await page.getByTestId('product-card').all();
  
  for (let i = 0; i < Math.min(3, products.length); i++) {
    await products[i].getByRole('button', { name: 'Compare' }).click();
  }
  
  expect(await page.getByText('Comparing 3 items')).toBeVisible();
});`,
      steps: demoSteps2,
      tags: ['scrape', 'catalog', 'e2e'],
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 14),
    },
  ];
};

export default function Gallery() {
  const { recipes, searchTerm, setSearchTerm, deleteRecipe } = useGalleryStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Seed demo data on first visit
  useEffect(() => {
    if (hasInitialized || recipes.length > 0) return;
    
    const demos = createDemoRecipes();
    const store = useGalleryStore.getState();
    
    demos.forEach((demo) => {
      store.addRecipe(demo);
    });
    
    setHasInitialized(true);
  }, [recipes.length, hasInitialized]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    
    const term = searchTerm.toLowerCase().trim();
    return recipes.filter((recipe) => 
      recipe.title.toLowerCase().includes(term) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [recipes, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this automation recipe?')) {
      deleteRecipe(id);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const loadRecipe = (recipe: ScriptRecipe) => {
    // This would integrate with main view in a full implementation.
    // For now we show a non-intrusive toast-style message.
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 glass text-white text-sm px-6 py-3 rounded-3xl shadow-2xl border border-white/20 z-50 flex items-center gap-3';
    toast.innerHTML = `📋 Loaded <span class="font-medium">"${recipe.title}"</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 1, 1)';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 20px)';
      setTimeout(() => document.body.removeChild(toast), 400);
    }, 2100);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="glass relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes..."
            className="w-full bg-transparent border-0 focus:outline-none pl-11 py-3 text-sm placeholder:text-white/30 rounded-3xl"
          />
        </div>
      </div>

      <div className="px-5 mb-3 flex items-center justify-between text-xs">
        <div className="text-white/40 font-medium">SAVED AUTOMATIONS</div>
        <div className="text-accent/70 text-[10px] flex items-center gap-1">
          <Tag className="w-3 h-3" /> {filteredRecipes.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 custom-scroll space-y-3 pb-8">
        <AnimatePresence initial={false}>
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, idx) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => loadRecipe(recipe)}
                className="glass group rounded-3xl p-5 cursor-pointer hover:ring-1 hover:ring-white/20 transition-all active:scale-[0.985]"
                whileHover={{ y: -1 }}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm leading-tight pr-6">
                    {recipe.title}
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, recipe.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-colors p-1 -mr-1 -mt-1"
                    aria-label="Delete recipe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block text-[10px] px-3 py-px rounded-3xl bg-white/10 text-white/60 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar className="w-3 h-3" />
                    {formatDate(recipe.createdAt)}
                  </div>
                  
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      loadRecipe(recipe);
                    }}
                    className="flex items-center gap-1 text-accent hover:text-[#22d3ee] transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    LOAD
                  </div>
                </div>

                {/* Code peek */}
                <div className="mt-5 text-[10px] font-mono text-white/30 line-clamp-2 border-t border-white/10 pt-4">
                  {recipe.code.split('\n')[0]}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center px-6">
              <div className="text-white/20 text-6xl mb-4">📦</div>
              <div className="text-white/40">No matching recipes</div>
              <div className="text-white/20 text-xs mt-2">Try a different keyword</div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const newRecipe: ScriptRecipe = {
              id: `manual-${Date.now()}`,
              title: 'New empty recipe',
              code: '// Paste or generate a new script here',
              steps: [],
              tags: ['manual'],
              createdAt: new Date(),
            };
            useGalleryStore.getState().addRecipe(newRecipe);
          }}
          className="w-full h-10 glass border border-white/10 hover:border-white/30 flex items-center justify-center gap-2 text-xs tracking-wider text-white/70 rounded-2xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> NEW RECIPE
        </motion.button>
      </div>
    </div>
  );
}
