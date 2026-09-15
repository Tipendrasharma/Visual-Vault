/**
 * Visual Vault - Creator Profile Page
 * Displays full creator details from the database:
 * Bio, location, social links, camera gear, follower count, total downloads, and portfolio works.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageCard from '../components/ImageCard.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import { 
  CheckCircle2, Camera, Globe, Instagram, Twitter, MapPin, 
  Download, Heart, UserPlus, UserCheck, ArrowLeft,
  Layers, Edit3
} from 'lucide-react';

export default function CreatorProfilePage() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  
  const [creator, setCreator] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCreatorDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const creatorId = id;
        if (!creatorId) {
          setError('Creator ID not provided');
          setLoading(false);
          return;
        }
        const res = await api.auth.getCreator(creatorId);
        if (res.success && res.data?.creator) {
          setCreator(res.data.creator);
          setWorks(res.data.works || []);
          setFollowerCount(res.data.creator.followerCount || 0);
        } else {
          setError('Creator not found');
        }
      } catch (err) {
        console.error('Failed to load creator:', err);
        setError('Could not retrieve creator details from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorDetails();
  }, [id]);

  // NOTE: Follow/unfollow only updates local state here — there is no
  // backend endpoint yet that saves a "follow" relationship to the
  // database, so this resets if the page is refreshed. Wiring this up
  // for real would mean adding a Follow model (who follows whom) and
  // a couple of API routes, similar to how Like/Bookmark work.
  const handleFollowToggle = () => {
    if (!user) {
      openAuthModal('login', 'user', 'Please log in to follow creators.');
      return;
    }
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Loading creator details from database...
        </p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Creator Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6">{error || 'This creator profile is unavailable.'}</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
      </div>
    );
  }

  const isSelf = user && (user.id === creator.id || user._id === creator.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
      </div>

      {/* Creator Hero Header Card */}
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 border border-neutral-800 shadow-xl mb-12 relative overflow-hidden">
        {/* Subtle background radial aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80'}
              alt={creator.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-neutral-800 shadow-lg"
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] tracking-tight">
                  {creator.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {creator.badge || 'Master Creator'}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Database Creator
                </span>
              </div>

              {creator.location && (
                <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {creator.location}
                </p>
              )}

              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                {creator.bio || 'Exploring brutalist architecture, cinematic lighting, and precision visual art for Visual Vault.'}
              </p>

              {/* Camera Gear Info */}
              {creator.cameraGear && (
                <div className="flex items-center gap-2 pt-1 text-xs text-amber-300/90 font-mono">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gear: {creator.cameraGear}</span>
                </div>
              )}

              {/* Social & Portfolio Links */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-neutral-400">
                {creator.website && (
                  <a
                    href={creator.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{creator.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {creator.instagram && (
                  <a
                    href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>{creator.instagram}</span>
                  </a>
                )}
                {creator.twitter && (
                  <a
                    href={`https://x.com/${creator.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>{creator.twitter}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action / Follow Button */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-3 w-full md:w-auto">
            {isSelf ? (
              <Link
                to="/profile"
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-full transition-all shadow text-center flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile in Database
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                  isFollowing
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Following Creator
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow Creator
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live Database Metrics Grid.
            Note: there's no "Views" stat here — the backend doesn't
            track image views anywhere, so rather than show a made-up
            number, we only display metrics that are genuinely real. */}
        <div className="mt-8 pt-6 border-t border-neutral-800 grid grid-cols-3 gap-4 text-center">
          <div className="bg-neutral-800/40 rounded-2xl p-4 border border-neutral-800">
            <p className="text-2xl font-bold text-white font-mono">{works.length}</p>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-neutral-400" /> Master Works
            </p>
          </div>
          <div className="bg-neutral-800/40 rounded-2xl p-4 border border-neutral-800">
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              {(creator.stats?.totalDownloads || creator.totalDownloads || 0).toLocaleString()}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
              <Download className="w-3 h-3 text-emerald-400" /> Downloads
            </p>
          </div>
         
        </div>
      </div>

      {/* Creator's Portfolio Gallery */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
            Master Works by {creator.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Original master RAW resolution photography preserved in the database
          </p>
        </div>
        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
          {works.length} photographs
        </span>
      </div>

      {works.length === 0 ? (
        <div className="bg-neutral-50 rounded-2xl p-12 text-center border border-neutral-200">
          <p className="text-sm text-neutral-500">This creator hasn't published master photographs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {works.map((img) => (
            <ImageCard
              key={img.id || img._id}
              image={img}
              onClick={() => setActiveModalImage(img)}
            />
          ))}
        </div>
      )}

      {/* Full Resolution Inspection Modal */}
      {activeModalImage && (
        <ImageDetailModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
        />
      )}
    </div>
  );
}
