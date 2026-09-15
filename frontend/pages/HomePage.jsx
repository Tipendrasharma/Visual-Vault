/**
 * Visual Vault - Home Page Component
 * The main discovery feed: search bar, category tabs, orientation/sort
 * filters, a masonry image grid, and "load more" pagination.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import ImageCard from '../components/ImageCard.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import { api } from '../services/api.js';
import { getImageOrientation } from '../utils/formatters.js';
import { Loader2, Filter, RefreshCw, ChevronDown, Check, RectangleHorizontal, RectangleVertical, Square, LayoutGrid } from 'lucide-react';

// Orientation options: All, Landscape, Portrait, Square
const ORIENTATION_OPTIONS = [
  { id: 'all', label: 'All Orientations', shortLabel: 'All' },
  { id: 'landscape', label: 'Landscape', shortLabel: 'Landscape' },
  { id: 'portrait', label: 'Portrait', shortLabel: 'Portrait' },
  { id: 'square', label: 'Square', shortLabel: 'Square' }
];

// "Highest Views" was removed here — the Image model doesn't actually
// track a view count anywhere in the backend, so that sort option
// would have looked real but done nothing. Only include sort options
// backed by real, tracked data.
const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'recent', label: 'Newest First' },
  { id: 'downloads', label: 'Most Downloaded' }
];

const CATEGORIES = [
  'Featured',
  'Wallpapers',
  '3D Renders',
  'Nature',
  'Textures',
  'Architecture',
  'Street & Urban',
  'Film',
  'Minimalism',
  'Portraits'
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All Works');
  const [selectedOrientation, setSelectedOrientation] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [orientationMenuOpen, setOrientationMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // useCallback wraps this function so it isn't recreated on every
  // render — it only changes when searchQuery/selectedCategory/
  // selectedSort change. This matters because other hooks below
  // (the useEffects) depend on this function's identity staying
  // stable to avoid re-running unnecessarily.
  const executeSearch = useCallback(async ({
    q = searchQuery,
    cat = selectedCategory,
    srt = selectedSort,
    pageNum = 1,
    isFresh = true
  } = {}) => {
    setLoading(true);
    if (isFresh) setPage(1);

    try {
      const res = await api.discovery.search({
        query: (q || '').trim(),
        category: cat === 'All Works' ? undefined : cat,
        sort: srt,
        page: pageNum,
        limit: 20
      });

      if (res.success && res.data) {
        const fetchedItems = res.data.images || res.data.items || [];
        if (isFresh) {
          setImages(fetchedItems);
        } else {
          setImages(prev => [...prev, ...fetchedItems]);
        }
        setTotalCount(res.data.total || res.data.totalCount || fetchedItems.length);
      }
    } catch (err) {
      console.error('Error fetching discovery feed:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedSort]);

  // Synchronize when URL search param ?q= changes
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    setSearchQuery(urlQ);
    executeSearch({ q: urlQ, pageNum: 1, isFresh: true });
  }, [searchParams]);

  // Trigger search when category or sort changes
  useEffect(() => {
    executeSearch({ q: searchQuery, cat: selectedCategory, srt: selectedSort, pageNum: 1, isFresh: true });
  }, [selectedCategory, selectedSort]);

  const handleSearchSubmit = (queryToSearch) => {
    const text = typeof queryToSearch === 'string' ? queryToSearch : searchQuery;
    setSearchQuery(text);
    setSearchParams(text ? { q: text } : {});
    executeSearch({ q: text, pageNum: 1, isFresh: true });
  };

  const handleTagClick = (tag) => {
    setActiveModalImage(null);
    handleSearchSubmit(tag);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    executeSearch({ q: searchQuery, cat: selectedCategory, srt: selectedSort, pageNum: nextPage, isFresh: false });
  };

  // Remove any image that fails to load from the state list
  const handleImageError = useCallback((failedId) => {
    setImages(prev => prev.filter(img => (img.id || img._id) !== failedId));
  }, []);

  // Filter items based on selected orientation (all, landscape, portrait, square)
  const filteredImages = useMemo(() => {
    if (!selectedOrientation || selectedOrientation === 'all') return images;
    return images.filter(img => {
      const orientation = getImageOrientation(img.dimensions, img);
      return orientation === selectedOrientation;
    });
  }, [images, selectedOrientation]);

  return (
    <div className="w-full">
      
      {/* Hero section */}
      <Hero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedOrientation={selectedOrientation}
        onSelectOrientation={setSelectedOrientation}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
      />

      {/* Main Visual Vault Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Unsplash-Style Sub-Navigation Category Bar */}
        <div className="border-b border-neutral-200 mb-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-6 sm:gap-8 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive =
                (cat === 'Featured' && (selectedCategory === 'All Works' || selectedCategory === 'Featured')) ||
                selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat === 'Featured' ? 'All Works' : cat);
                    setSearchQuery('');
                  }}
                  className={`py-3 text-xs sm:text-sm transition-colors relative whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-neutral-950 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 font-medium'
                  }`}
                >
                  {cat}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-950 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200/80">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-neutral-900 font-['Plus_Jakarta_Sans']">
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategory}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
              {filteredImages.length} of {totalCount || images.length} assets
            </span>
          </div>

          {/* Interactive Working Filter Buttons for Orientation and Sort */}
          <div className="flex items-center gap-2.5 relative">
            {/* Orientation Filter Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="quality-filter-btn"
                onClick={() => {
                  setOrientationMenuOpen(prev => !prev);
                  setSortMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 active:scale-95 cursor-pointer ${
                  selectedOrientation !== 'all'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-neutral-200'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <span className={selectedOrientation !== 'all' ? 'text-neutral-300' : 'text-neutral-400'}>Orientation:</span>
                <strong className={`font-semibold capitalize ${selectedOrientation !== 'all' ? 'text-white' : 'text-neutral-900'}`}>
                  {selectedOrientation === 'all'
                    ? 'All'
                    : selectedOrientation === 'landscape'
                    ? 'Landscape'
                    : selectedOrientation === 'portrait'
                    ? 'Portrait'
                    : 'Square'}
                </strong>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  selectedOrientation !== 'all' ? 'text-neutral-300' : 'text-neutral-500'
                } ${orientationMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {orientationMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setOrientationMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                      Filter by Orientation
                    </div>
                    {ORIENTATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrientation(opt.id);
                          setOrientationMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          selectedOrientation === opt.id
                            ? 'bg-neutral-900 text-white font-medium'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {opt.id === 'landscape' && <RectangleHorizontal className="w-3.5 h-3.5" />}
                          {opt.id === 'portrait' && <RectangleVertical className="w-3.5 h-3.5" />}
                          {opt.id === 'square' && <Square className="w-3.5 h-3.5" />}
                          {opt.id === 'all' && <LayoutGrid className="w-3.5 h-3.5" />}
                          <span>{opt.label}</span>
                        </div>
                        {selectedOrientation === opt.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Filter Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="sort-filter-btn"
                onClick={() => {
                  setSortMenuOpen(prev => !prev);
                  setOrientationMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 active:scale-95 cursor-pointer ${
                  selectedSort !== 'popular'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-neutral-200'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <span className={selectedSort !== 'popular' ? 'text-neutral-300' : 'text-neutral-400'}>Sort:</span>
                <strong className={`font-semibold capitalize ${selectedSort !== 'popular' ? 'text-white' : 'text-neutral-900'}`}>
                  {SORT_OPTIONS.find(s => s.id === selectedSort)?.label || selectedSort}
                </strong>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  selectedSort !== 'popular' ? 'text-neutral-300' : 'text-neutral-500'
                } ${sortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setSortMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-neutral-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                      Sort Results By
                    </div>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedSort(opt.id);
                          setSortMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          selectedSort === opt.id
                            ? 'bg-neutral-900 text-white font-medium'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedSort === opt.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && images.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-sm font-medium">Loading crystal-clear high resolution visual stream...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-base font-semibold text-neutral-800 mb-1">No images match this filter</p>
            <p className="text-xs text-neutral-500 mb-4">Try resetting your quality filter or search query</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Works');
                setSelectedOrientation('all');
              }}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <>
            {/* Unsplash-Style Masonry Columns Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
              {filteredImages.map((img) => (
                <div key={img.id || img._id} className="break-inside-avoid mb-6">
                  <ImageCard
                    image={img}
                    onClick={() => setActiveModalImage(img)}
                    onError={handleImageError}
                  />
                </div>
              ))}
            </div>

            {/* Load More Pagination */}
            {images.length < totalCount && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-full border border-neutral-300 shadow-sm transition-all flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Load More Assets</span>
                </button>
              </div>
            )}
          </>
        )}

      </section>

      {/* Inspect Detail Modal */}
      {activeModalImage && (
        <ImageDetailModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
          onTagClick={handleTagClick}
        />
      )}

    </div>
  );
}
