/**
 * Visual Vault - Explore Page
 *
 * Shows 4 real sections built from actual database data: Most Liked,
 * Most Downloaded, Newest, Popular Categories, plus a Top Creators
 * grid. Every number here comes from real likes/downloads/upload
 * dates — nothing is a fake or simulated metric.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageCard from '../components/ImageCard.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import { 
  Star, 
  Heart, 
  Sparkles, 
  Palette, 
  Users, 
  ArrowRight, 
  Compass, 
  Download, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  RefreshCw
} from 'lucide-react';

// Section tabs list for quick navigation. Each id maps directly to a
// key returned by GET /api/discovery/explore (see discoveryService.js).
const SECTION_TABS = [
  { id: 'all', label: 'All Sections', icon: Compass },
  { id: 'downloaded', label: '⭐ Most Downloaded', icon: Star },
  { id: 'liked', label: '❤️ Most Liked', icon: Heart },
  { id: 'new', label: '🆕 New Images', icon: Sparkles },
  { id: 'categories', label: '🎨 Popular Categories', icon: Palette },
  { id: 'creators', label: '👨‍💻 Top Creators', icon: Users }
];

export default function ExplorePage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(null);

  // Shape matches exactly what discoveryService.getExploreSections()
  // returns on the backend — see backend/services/discoveryService.js
  const [data, setData] = useState({
    mostLiked: [],
    mostDownloaded: [],
    newest: [],
    popularCategories: [],
    topCreators: []
  });

  const loadExploreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.discovery.getExploreSections();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Failed to load sections');
      }
    } catch (err) {
      console.error('Error fetching explore sections:', err);
      setError('Could not load explore data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExploreData();
  }, []);

  // Removes one broken image from whichever section it belongs to,
  // without needing to re-fetch everything from the server.
  const handleRemoveImage = (sectionKey, imageId) => {
    setData(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || []).filter(img => (img.id || img._id) !== imageId)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              <Compass className="w-4 h-4 text-neutral-800" />
              <span>Real-Data Discovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Explore Visual Vault
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5 max-w-2xl">
              Built from real likes, downloads, and upload dates — no simulated stats.
            </p>
          </div>
        </div>

        {/* Section Tabs (Quick Jump) */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none pb-2">
          {SECTION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-neutral-900 animate-spin mb-3" />
          <p className="text-sm font-medium text-neutral-600">Loading real-time rankings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
          <p className="text-sm font-semibold text-red-700 mb-3">{error}</p>
          <button
            onClick={loadExploreData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-black cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="space-y-14">

          {/* Most Downloaded */}
          {(activeTab === 'all' || activeTab === 'downloaded') && (
            <section id="downloaded" className="scroll-mt-20">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⭐</span>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Most Downloaded</h2>
                    <p className="text-xs text-neutral-500">Ranked by real download counts</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
                  {data.mostDownloaded?.length || 0} Assets
                </span>
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
                {(data.mostDownloaded || []).map((img) => (
                  <div key={img.id || img._id} className="break-inside-avoid mb-5">
                    <ImageCard
                      image={img}
                      onClick={() => setActiveModalImage(img)}
                      onError={(badId) => handleRemoveImage('mostDownloaded', badId)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Most Liked */}
          {(activeTab === 'all' || activeTab === 'liked') && (
            <section id="liked" className="scroll-mt-20">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">❤️</span>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Most Liked</h2>
                    <p className="text-xs text-neutral-500">Community favorites with the highest like count</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full">
                  {data.mostLiked?.length || 0} Assets
                </span>
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
                {(data.mostLiked || []).map((img) => (
                  <div key={img.id || img._id} className="break-inside-avoid mb-5">
                    <ImageCard
                      image={img}
                      onClick={() => setActiveModalImage(img)}
                      onError={(badId) => handleRemoveImage('mostLiked', badId)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New Images */}
          {(activeTab === 'all' || activeTab === 'new') && (
            <section id="new" className="scroll-mt-20">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🆕</span>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">New Images</h2>
                    <p className="text-xs text-neutral-500">Most recently uploaded, newest first</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">
                  {data.newest?.length || 0} Assets
                </span>
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
                {(data.newest || []).map((img) => (
                  <div key={img.id || img._id} className="break-inside-avoid mb-5">
                    <ImageCard
                      image={img}
                      onClick={() => setActiveModalImage(img)}
                      onError={(badId) => handleRemoveImage('newest', badId)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Categories */}
          {(activeTab === 'all' || activeTab === 'categories') && (
            <section id="categories" className="scroll-mt-20">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎨</span>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Popular Categories</h2>
                    <p className="text-xs text-neutral-500">Real uploads grouped by category</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full">
                  {data.popularCategories?.length || 0} Categories
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(data.popularCategories || []).map((cat, idx) => (
                  <div
                    key={cat.name || idx}
                    onClick={() => navigate(`/?q=${encodeURIComponent(cat.name)}`)}
                    className="group relative rounded-3xl overflow-hidden aspect-[16/10] bg-neutral-900 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <img
                      src={cat.sampleImage}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 flex flex-col justify-end text-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          {cat.count} {cat.count === 1 ? 'Asset' : 'Assets'}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-amber-200 transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top Creators */}
          {(activeTab === 'all' || activeTab === 'creators') && (
            <section id="creators" className="scroll-mt-20">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">👨‍💻</span>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Top Creators</h2>
                    <p className="text-xs text-neutral-500">Real users who have uploaded images</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                  {data.topCreators?.length || 0} Creators
                </span>
              </div>

              {data.topCreators && data.topCreators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.topCreators.map((c) => (
                    <div
                      key={c.id}
                      className="bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200/90 rounded-3xl p-6 transition-all flex flex-col justify-between hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-neutral-900">
                                {c.name}
                              </h3>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px] font-semibold text-neutral-600">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Heart className="w-3 h-3 text-rose-500" />
                          {(c.totalLikes || 0).toLocaleString()} likes
                        </span>
                        <span className="text-neutral-500">
                          {c.totalUploads || 0} uploads
                        </span>
                        <Link
                          to={`/creator/${c.id}`}
                          className="text-neutral-900 hover:text-black font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Portfolio &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-3xl p-8 text-center max-w-lg mx-auto">
                  <p className="text-sm font-semibold text-neutral-800 mb-1">No creators registered yet</p>
                  <p className="text-xs text-neutral-500 mb-4">Upload your photographs in Studio Vault to get featured here.</p>
                  <Link
                    to="/studio"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black cursor-pointer"
                  >
                    <span>Go to Studio Vault</span>
                  </Link>
                </div>
              )}
            </section>
          )}

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
