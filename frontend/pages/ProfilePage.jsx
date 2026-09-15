/**
 * Visual Vault - Profile Page
 * User details, creator gear specs, uploaded images, liked images, saved bookmarks, and download history.
 * Supports updating profile and creator details directly in the database, and editing uploaded image metadata.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useVault } from '../context/VaultContext.jsx';
import { useSocial } from '../context/SocialContext.jsx';
import { api } from '../services/api.js';
import ImageCard from '../components/ImageCard.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import EditProfileModal from '../components/EditProfileModal.jsx';
import EditImageModal from '../components/EditImageModal.jsx';
import { 
  User, Heart, Bookmark, Download, Layers, 
  CheckCircle2, Clock, Edit3, MapPin, Camera, Globe, 
  Instagram, Twitter, ExternalLink, RefreshCw
} from 'lucide-react';
import { formatDate, getImageQuality } from '../utils/formatters.js';

export default function ProfilePage() {
  const { user, openAuthModal } = useAuth();
  const { vaultImages, fetchVaultData } = useVault();
  const { downloadHistory, triggerDownload } = useSocial();

  const [activeTab, setActiveTab] = useState('likes'); // 'uploads' | 'likes' | 'saved' | 'downloads'
  const [likedImages, setLikedImages] = useState([]);
  const [savedImages, setSavedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);

  const loadProfileCollections = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [likesRes, savedRes] = await Promise.all([
        api.social.getUserLikes(),
        api.social.getUserBookmarks()
      ]);
      // The backend returns the array under `images` for both of these
      // endpoints (see socialController.js: getUserLikes/getUserBookmarks)
      if (likesRes.success && likesRes.data?.images) {
        setLikedImages(likesRes.data.images);
      }
      if (savedRes.success && savedRes.data?.images) {
        setSavedImages(savedRes.data.images);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileCollections();
  }, [user, activeTab]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-['Plus_Jakarta_Sans']">
          Profile Authentication Required
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Sign in to view your uploaded master assets, liked photographs, and download logs.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow"
        >
          Sign In
        </button>
      </div>
    );
  }

  const isCreator = user.role === 'creator';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Profile Identity Card */}
      <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-200/80 mb-10 shadow-xs relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
            <div className="relative">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-neutral-300 shadow-sm"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
                  {user.name}
                </h1>
                {isCreator ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                    {user.badge || 'Creator'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
                    User / Collector
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="font-mono">{user.email}</span>
                {user.location && (
                  <span className="flex items-center gap-1 text-neutral-600">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {user.location}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 max-w-xl pt-1 leading-relaxed">
                {user.bio || 'Minimalist photographer & visual curator on Visual Vault.'}
              </p>

              {/* Creator Camera Gear & Social handles if available */}
              {user.cameraGear && (
                <div className="flex items-center gap-2 pt-1 text-xs text-neutral-800 font-medium">
                  <Camera className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Gear: {user.cameraGear}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-500">
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-black transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{user.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {user.instagram && (
                  <span className="flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>{user.instagram}</span>
                  </span>
                )}
                {user.twitter && (
                  <span className="flex items-center gap-1">
                    <Twitter className="w-3.5 h-3.5 text-blue-500" />
                    <span>{user.twitter}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-4 lg:pt-0 lg:pl-8 w-full lg:w-auto">
            <div className="flex gap-6 text-center sm:text-left">
              
              <div>
                <p className="text-2xl font-bold text-neutral-900">{likedImages.length}</p>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Likes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{downloadHistory.length}</p>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Downloads</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 w-full sm:w-auto">
              <button
                onClick={() => setEditProfileOpen(true)}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile in Database
              </button>

              {isCreator && (
                <Link
                  to={`/creator/${user.id || user._id}`}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Creator Page
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'uploads'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >


        </button>

        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'likes'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Images ({likedImages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'saved'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Bookmarks ({savedImages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'downloads'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Download History ({downloadHistory.length})</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      <div>
        

        {activeTab === 'likes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {likedImages.length === 0 ? (
              <p className="text-xs text-neutral-400 col-span-full py-12 text-center">No liked images yet.</p>
            ) : (
              likedImages.map(img => (
                <ImageCard
                  key={img.id || img._id}
                  image={img}
                  onClick={() => setActiveModalImage(img)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {savedImages.length === 0 ? (
              <p className="text-xs text-neutral-400 col-span-full py-12 text-center">No saved bookmarks yet.</p>
            ) : (
              savedImages.map(img => (
                <ImageCard
                  key={img.id || img._id}
                  image={img}
                  onClick={() => setActiveModalImage(img)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                  <th className="p-3.5">Asset</th>
                  <th className="p-3.5">Resolution Grade</th>
                  <th className="p-3.5">Downloaded At</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {downloadHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-neutral-400">
                      No downloads logged yet in database.
                    </td>
                  </tr>
                ) : (
                  downloadHistory.map(dl => {
                    const quality = getImageQuality(dl.image?.dimensions);
                    return (
                      <tr key={dl.downloadId || dl._id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="p-3.5 flex items-center gap-3">
                          <img
                            src={dl.image?.thumbnailUrl || dl.image?.imageUrl}
                            alt={dl.image?.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">{dl.image?.title || 'Stock Photograph'}</p>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {dl.image?.dimensions ? `${dl.image.dimensions.width}×${dl.image.dimensions.height}` : 'HD'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3.5 text-neutral-600 font-medium">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${quality.color}`}>
                            {quality.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-neutral-500">
                          {formatDate(dl.downloadedAt || dl.createdAt)}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => triggerDownload(dl.image)}
                            className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Again</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Inspection Modal */}
      {activeModalImage && (
        <ImageDetailModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
        />
      )}

      {/* Edit Profile & Creator Details Modal */}
      {editProfileOpen && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          onUpdated={loadProfileCollections}
        />
      )}

      {/* Edit Image Metadata in Database Modal */}
      {editingImage && (
        <EditImageModal
          image={editingImage}
          isOpen={Boolean(editingImage)}
          onClose={() => setEditingImage(null)}
          onUpdated={() => {
            fetchVaultData();
            loadProfileCollections();
          }}
        />
      )}

    </div>
  );
}
