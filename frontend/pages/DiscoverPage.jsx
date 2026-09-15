/**
 * Visual Vault - Discover Page
 * High-Resolution Discovery Matrix filtering by visual fidelity and display resolution.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import ImageCard from '../components/ImageCard.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import { getImageQuality } from '../utils/formatters.js';
import { Layers, Search, CheckCircle, Database, Zap } from 'lucide-react';

export default function DiscoverPage() {
  const [activeTier, setActiveTier] = useState('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModalImage, setActiveModalImage] = useState(null);

  const qualityTiers = [
    { id: 'all', name: 'All Visual Assets', res: '3840p to 720p', status: 'Full Spectrum' },
    { id: '4k', name: '4K Ultra HD (UHD)', res: '3840×2160+ px', status: 'Ultra Fidelity' },
    { id: '2k', name: '2K Quad HD (QHD)', res: '2560×1440 px', status: 'Crisp QHD' },
    { id: 'fhd', name: 'Full HD (1080p)', res: '1920×1080 px', status: 'High Res' },
    { id: 'hd', name: 'HD Ready (720p)', res: '1280×720 px', status: 'Standard HD' }
  ];

  const handleSearch = async (targetQuery = query) => {
    setLoading(true);
    try {
      const res = await api.discovery.search({
        query: targetQuery.trim(),
        limit: 24
      });
      if (res.success && res.data) {
        setResults(res.data.images || res.data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // useEffect with [] runs this search exactly once, right when the
  // page first loads, so results are already there before the user
  // types anything.
  useEffect(() => {
    handleSearch(query);
  }, []);

  // useMemo re-runs this filter ONLY when `results` or `activeTier`
  // actually change — not on every re-render of the page — which
  // avoids re-filtering the same list unnecessarily.
  const filteredResults = useMemo(() => {
    if (!activeTier || activeTier === 'all') return results;
    return results.filter(item => {
      const q = getImageQuality(item.dimensions);
      return q.tier === activeTier;
    });
  }, [results, activeTier]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title & Engine Specs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Database className="w-4 h-4" />
            <span>High-Fidelity Visual Index</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Visual Resolution Matrix
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Search, filter, and inspect photos calibrated by pixel density and display resolution.
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search high-resolution aesthetics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100 rounded-full border border-neutral-200 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 shrink-0 cursor-pointer"
          >
            Query
          </button>
        </div>
      </div>

      {/* Quality Tier Tabs with Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {qualityTiers.map(tier => {
          const isSelected = activeTier === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => setActiveTier(tier.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                  : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`}>
                  {tier.status}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  {tier.res}
                </span>
              </div>
              <p className="font-semibold text-xs truncate">{tier.name}</p>
            </button>
          );
        })}
      </div>

      {/* Grid Results */}
      {filteredResults.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <p className="text-sm font-semibold text-neutral-800 mb-1">No assets found in this resolution tier</p>
          <p className="text-xs">Try selecting 'All Visual Assets' or adjusting your query</p>
          <button
            onClick={() => setActiveTier('all')}
            className="mt-3 px-4 py-1.5 bg-neutral-900 text-white text-xs rounded-full cursor-pointer hover:bg-black"
          >
            Show All Resolutions
          </button>
        </div>
      ) : (
        /* This is a masonry-style grid done with pure CSS columns
           (no JS library needed) — the browser flows items into
           whichever column is shortest, giving the Pinterest-like
           staggered look. */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {filteredResults.map(item => (
            <div key={item.id || item._id} className="break-inside-avoid mb-6">
              <ImageCard
                image={item}
                onClick={() => setActiveModalImage(item)}
                onError={(badId) => setResults(prev => prev.filter(x => (x.id || x._id) !== badId))}
              />
            </div>
          ))}
        </div>
      )}

      {activeModalImage && (
        <ImageDetailModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
        />
      )}

    </div>
  );
}

