/**
 * Visual Vault - Hero Component
 * The big search banner at the top of the homepage — search bar,
 * trending keyword shortcuts, and an expandable advanced-filters panel.
 */

import React, { useState } from 'react';
import { Search, ArrowRight, Zap, SlidersHorizontal, Check } from 'lucide-react';

export default function Hero({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  selectedOrientation = 'all',
  onSelectOrientation = () => {},
  selectedSort,
  onSelectSort
}) {
  // Just one local piece of state: whether the advanced filters
  // panel is open. Everything else here (search text, filters) is
  // passed down as props from the parent page, since that page
  // needs to know their values too (to actually run the search).
  const [showAdvanced, setShowAdvanced] = useState(false);

  const trendingKeywords = [
    'Black sports car at night',
    'White gaming setup minimal',
    'Minimalist office workspace',
    'Cute golden retriever puppy'
  ];

  const categories = [
    'All Works',
    'Nature & Landscape',
    'Architecture',
    'Street & Urban',
    '3D & CGI',
    'Minimalism',
    'Portraits'
  ];

  // Beginner-friendly orientation options: All, Landscape, Portrait, Square
  const orientationOptions = [
    { id: 'all', label: 'All' },
    { id: 'landscape', label: 'Landscape' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'square', label: 'Square' }
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  const handleTrendingClick = (keyword) => {
    setSearchQuery(keyword);
    onSearchSubmit(keyword);
  };

  return (
    <div className="pt-8 pb-4 text-center max-w-5xl mx-auto px-4">
      {/* Micro Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/60 text-[11px] font-bold text-orange-800 tracking-wide uppercase">
          <Zap className="w-3 h-3 text-orange-600 fill-orange-500" />
          <span>Search • Discover • Collect • Manage Images</span>
        </div>
      </div>

      {/* 3. Hero Display Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-[-0.035em] text-neutral-900 mb-4 leading-[1.1] font-['Plus_Jakarta_Sans'] max-w-4xl mx-auto">
        <span>One Search.</span>{' '}
        <span className="font-serif italic font-normal text-neutral-600">Crystal Clear</span>{' '}
        <span>Visuals.</span>
      </h1>

      {/* 4. Subtitle */}
      <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 leading-relaxed mb-8">
        Explore and download millions of high-resolution, crystal-clear 4K, 2K, and Full HD photos in one unified search experience.
      </p>

      {/* 5. Big Unified Search Bar */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="relative flex items-center bg-white rounded-full shadow-lg shadow-neutral-200/60 border border-neutral-200 p-1.5 transition-all focus-within:border-neutral-400 focus-within:shadow-xl">
          <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search high-resolution photos (e.g. black sports car at night)..."
            className="w-full px-3.5 py-2.5 text-neutral-900 placeholder:text-neutral-400 bg-transparent text-sm sm:text-base focus:outline-none"
          />
          <button
            onClick={() => onSearchSubmit(searchQuery)}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-full shrink-0 shadow transition-all cursor-pointer"
          >
            Search All
          </button>
        </div>
      </div>

      {/* trendingKeywords.map(...) turns our array of strings into an
          array of buttons — this is the standard way to render a list
          in React, instead of writing out each button by hand */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500 mb-6">
        <span className="font-semibold text-neutral-700">Trending:</span>
        {trendingKeywords.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleTrendingClick(item)}
            className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
          >
            {item}
          </button>
        ))}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-2 inline-flex items-center gap-1 font-semibold text-neutral-900 hover:underline cursor-pointer"
        >
          <span>Advanced Search</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 7. Collapsible Advanced Search Filters */}
      {showAdvanced && (
        <div className="max-w-3xl mx-auto bg-neutral-50 border border-neutral-200 rounded-2xl p-4 mb-6 text-left text-xs transition-all">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-2">
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Advanced Filters
            </span>
            <button
              onClick={() => {
                onSelectOrientation('all');
                onSelectSort('popular');
              }}
              className="text-neutral-500 hover:text-black underline text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filter by Orientation */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">Orientation</label>
              <div className="flex flex-wrap gap-1.5">
                {orientationOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onSelectOrientation(opt.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                      selectedOrientation === opt.id
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">Sort Order</label>
              <div className="flex gap-2">
                {[
                  { id: 'popular', label: 'Most Popular' },
                  { id: 'downloads', label: 'Most Downloaded' },
                  { id: 'recent', label: 'Latest Added' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSort(s.id)}
                    className={`px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                      selectedSort === s.id
                        ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Orientation Filter Options (All, Landscape, Portrait, Square) */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Orientation:
        </span>
        {orientationOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelectOrientation(selectedOrientation === opt.id ? 'all' : opt.id)}
            className={`px-3.5 py-1 text-xs rounded-full border font-medium transition-all cursor-pointer ${
              selectedOrientation === opt.id
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

    </div>
  );
}

