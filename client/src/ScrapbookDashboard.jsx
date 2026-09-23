import React, { useState, useRef } from 'react';
import { 
  Heart, 
  Search, 
  Mic, 
  Menu, 
  Plus, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Music, 
  Camera, 
  Sparkles, 
  Pin, 
  User, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Mail,
  LogOut,
  Settings,
  MessageCircleHeart,
  Volume2
} from 'lucide-react';

const PLAYLIST_TRACKS = [
  { id: 1, title: 'Cara Bahagia', artist: 'Yotari', duration: '3:45' },
  { id: 2, title: 'Balada Insan Muda', artist: 'Diskoria', duration: '4:12' },
  { id: 3, title: 'Aurora', artist: "MALIQ & D'Essentials", duration: '3:50' },
  { id: 4, title: 'Golden Hour', artist: 'JVKE', duration: '3:29' }
];

export default function ScrapbookDashboard({
  activeUser = 'Me',
  onToggleUser,
  users = [],
  notes = [],
  onOpenCreateNote,
  onOpenProfile,
  onViewFeed,
  onViewVault,
  searchQuery,
  onSearchChange,
  onSelectPhotoPreview
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [activeHearts, setActiveHearts] = useState([true, true, false]);
  const [whisperReply, setWhisperReply] = useState('');
  const [activeVoiceModal, setActiveVoiceModal] = useState(false);

  const currentTrack = PLAYLIST_TRACKS[currentTrackIndex];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST_TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST_TRACKS.length) % PLAYLIST_TRACKS.length);
    setIsPlaying(true);
  };

  const toggleHeart = (index) => {
    setActiveHearts(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Current & Partner info
  const currentUserObj = users.find(u => 
    u.username?.toLowerCase() === activeUser?.toLowerCase() ||
    u.display_name?.toLowerCase() === activeUser?.toLowerCase() ||
    (activeUser === 'Me' && (Number(u.id) === 1 || u.username === 'me')) ||
    (activeUser === 'Her' && (Number(u.id) === 2 || u.username === 'her'))
  ) || (activeUser === 'Her' ? users[1] : users[0]) || {
    display_name: activeUser,
    avatar_url: activeUser === 'Me' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  };
  const partnerUser = users.find(u => 
    u.username?.toLowerCase() !== currentUserObj?.username?.toLowerCase() &&
    u.id !== currentUserObj?.id
  ) || {
    display_name: activeUser === 'Me' ? 'Her' : 'Me',
    bio: 'My favorite human & sanctuary 🌙'
  };

  // Recent notes for whispers
  const recentWhispers = notes.slice(0, 4);

  return (
    <div className="scrapbook-page-root">
      {/* Decorative ambient silk ribbons & shadows */}
      <img 
        src="/assets/crimson_ribbon.jpg" 
        alt="Crimson Silk Ribbon Top" 
        className="scrapbook-ribbon-top-right" 
      />
      <img 
        src="/assets/crimson_ribbon.jpg" 
        alt="Crimson Silk Ribbon Bottom" 
        className="scrapbook-ribbon-bottom-left" 
      />

      <div className="scrapbook-inner-container">
        {/* Top Banner Capsule */}
        <div className="top-collab-banner">
          <span>~ COLLAB MODE: ON. CREATING TOGETHER ~</span>
        </div>

        {/* Top Search & Controls Bar */}
        <header className="scrapbook-top-bar">
          <div className="search-capsule-wrapper">
            <Search className="search-icon text-[#5C1217] w-4 h-4" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search our love notes, songs, memories..."
              className="search-capsule-input"
            />
            <button 
              type="button" 
              className="mic-btn"
              title="Voice Whispers"
              onClick={() => setActiveVoiceModal(true)}
            >
              <Mic className="w-4 h-4 text-[#5C1217]" />
            </button>
          </div>

          <div className="top-action-capsules">
            <button 
              onClick={onViewFeed}
              className="action-nav-pill active"
              title="Scrapbook Notes Feed"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#5C1217]" />
              <span className="hidden sm:inline">Scrapbook</span>
            </button>

            <button 
              onClick={onViewVault}
              className="action-nav-pill"
              title="Letter Vault"
            >
              <Mail className="w-3.5 h-3.5 text-[#5C1217]" />
              <span className="hidden sm:inline">Letters</span>
            </button>

            <button 
              onClick={onToggleUser}
              className="action-nav-pill profile-pill"
              title="Click to switch between Me & Her"
            >
              <img 
                src={currentUserObj?.avatar_url || currentUserObj?.profile_pic_url || (activeUser === 'Me' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80')} 
                alt={activeUser} 
                className="user-nav-avatar"
              />
              <span className="font-semibold text-[#5C1217]">{currentUserObj?.display_name || activeUser}</span>
              <span className="text-[10px] opacity-60 ml-0.5">⇄ Switch</span>
            </button>

            <button 
              onClick={onOpenProfile}
              className="action-nav-pill"
              title="Edit Profiles"
            >
              <Settings className="w-3.5 h-3.5 text-[#5C1217]" />
              <span className="hidden sm:inline">Profiles</span>
            </button>
          </div>
        </header>

        {/* Main Pinterest-Style Collage Grid */}
        <main className="pinterest-collage-layout">
          {/* Top Section */}
          <section className="collage-hero-section">
            
            {/* Top Left: Framed Cozy Bed Memory Card */}
            <div className="card-cozy-memory">
              {/* Overlapping Heart Pin */}
              <div className="heart-badge-pin" title="Our Sacred Space">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>

              <div 
                className="memory-image-container cursor-pointer"
                onClick={() => onSelectPhotoPreview('/assets/cozy_heart_bed.jpg', 'Morning Reflections with You')}
              >
                <img 
                  src="/assets/cozy_heart_bed.jpg" 
                  alt="Cozy bed with hearts and book" 
                  className="memory-image"
                />
              </div>

              <div className="memory-date-pill">
                <span>APRIL 2025</span>
              </div>
            </div>

            {/* Top Right: "Start fresh!!" Main Hero Reminder Card */}
            <div className="card-start-fresh-hero">
              {/* Overlapping Fresh Red Rose Graphic */}
              <div className="overlapping-rose-element">
                <img 
                  src="/assets/red_rose_stem.jpg" 
                  alt="Romantic Red Rose" 
                  className="rose-stem-img"
                />
                <div className="rose-star-badge" title="Forever Yours">
                  <span>★</span>
                </div>
              </div>

              <div className="hero-text-content">
                <h1 className="hero-cursive-title">Start fresh!!</h1>
                
                <p className="hero-reminder-quote">
                  Good morning! Here's your gentle reminder that today is a brand new page. 
                  Whatever happened yesterday, it's already behind you. Breathe deep, smile a little, 
                  and walk into today with hope in your pocket and light in your step. You've got this!
                </p>

                <div className="hero-actions-row">
                  <button 
                    onClick={onOpenCreateNote}
                    className="hero-more-pill-btn"
                  >
                    <span>Write Note</span>
                    <Plus className="w-3.5 h-3.5 circle-plus-icon" />
                  </button>

                  {/* 3 Hearts Indicator */}
                  <div className="hearts-indicator-group">
                    {activeHearts.map((isActive, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        onClick={() => toggleHeart(idx)}
                        className="heart-indicator-btn"
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 transition-transform hover:scale-125 ${
                            isActive ? 'text-[#851722] fill-current' : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Middle Row: Spotify Player & Playlist Cards */}
          <section className="collage-middle-section">
            
            {/* Middle Left: Deep Crimson Spotify Lyric Card */}
            <div className="card-spotify-lyric">
              <div className="spotify-header">
                <div className="spotify-icon-badge">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div className="spotify-title-group">
                  <span className="song-name">Cara Bahagia</span>
                  <span className="artist-name">Yotari</span>
                </div>
              </div>

              <div className="lyrics-body-text">
                <p>
                  semua kata orang membuatmu meradang. Dengarlah yang akan aku katakan. 
                  Kamu berharga kamu sempurna (sempurna){' '}
                  <span className="lyric-pill-highlight">
                    coba lihatlah di cermin senyuman indahmu itu
                  </span>
                  . Tak perlu sama dengan si dia, oh-oo kita semua di cipta indah dengan cara yang berbeda.
                </p>
              </div>
            </div>

            {/* Middle Right: Shared Songs Playlist Card */}
            <div className="card-morning-playlist">
              <h3 className="playlist-title">
                <span>Morning Playlist</span>
              </h3>
              
              <div className="playlist-tracks-list">
                {(() => {
                  const dbSongNotes = notes.filter((n) => n.category === 'song');
                  const displaySongs = dbSongNotes.length > 0
                    ? dbSongNotes.slice(0, 3)
                    : [
                        {
                          id: 's1',
                          content: 'Cara Bahagia',
                          sender_name: 'Yotari',
                          image_url: '/assets/heart_coffee_breakfast.jpg'
                        },
                        {
                          id: 's2',
                          content: 'Balada Insan Muda',
                          sender_name: 'Diskoria',
                          image_url: '/assets/strawberry_cheesecake.jpg'
                        },
                        {
                          id: 's3',
                          content: 'Aurora',
                          sender_name: "MALIQ & D'Essentials",
                          image_url: '/assets/strawberry_snacks.jpg'
                        }
                      ];

                  return displaySongs.map((song) => {
                    const foundSender = users.find(u => 
                      u.display_name?.toLowerCase() === song.sender_name?.toLowerCase() ||
                      u.username?.toLowerCase() === song.sender_name?.toLowerCase() ||
                      (song.sender_name?.toLowerCase() === 'her' && (u.username === 'her' || Number(u.id) === 2)) ||
                      (song.sender_name?.toLowerCase() === 'me' && (u.username === 'me' || Number(u.id) === 1))
                    );
                    const fallbackImg = foundSender?.avatar_url || foundSender?.profile_pic_url || '/assets/strawberry_snacks.jpg';
                    const songImg = song.image_url || fallbackImg;

                    return (
                      <div 
                        key={song.id} 
                        className="playlist-track-row cursor-pointer"
                        onClick={() => {
                          if (song.image_url && onSelectPhotoPreview) {
                            onSelectPhotoPreview(song.image_url, `Song: ${song.content}`);
                          }
                        }}
                      >
                        <img 
                          src={songImg} 
                          alt={song.content} 
                          className="playlist-track-thumb"
                        />
                        <div className="track-info">
                          <span className="track-name">{song.content}</span>
                          <span className="track-sub">Shared by {song.sender_name}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </section>

          {/* Bottom Section: Photos, Moments, Chat & Snaps */}
          <section className="collage-bottom-section">
            
            {/* Bottom Left: Scalloped Heart Teacup & Strawberry Breakfast */}
            <div className="card-photo-date">
              <div 
                className="photo-frame cursor-pointer"
                onClick={() => onSelectPhotoPreview('/assets/heart_coffee_breakfast.jpg', 'Sweet Morning Breakfast & Coffee')}
              >
                <img 
                  src="/assets/heart_coffee_breakfast.jpg" 
                  alt="Heart cup coffee and strawberry cheesecake" 
                  className="photo-img"
                />
              </div>
              <div className="card-footer-pills">
                <span className="tag-pill-solid">Photos</span>
                <button 
                  onClick={onViewFeed}
                  className="see-more-pill"
                >
                  <span>See more</span>
                  <Play className="w-2.5 h-2.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Bottom Middle: Strawberry Cheesecake Moments Video Card */}
            <div className="card-video-moment">
              <div 
                className="video-frame cursor-pointer group"
                onClick={() => onSelectPhotoPreview('/assets/strawberry_cheesecake.jpg', 'Strawberry Cheesecake Moment')}
              >
                <img 
                  src="/assets/strawberry_cheesecake.jpg" 
                  alt="Strawberry cheesecake on ruffled plate" 
                  className="video-thumbnail"
                />
                <div className="video-play-overlay">
                  <div className="video-play-bubble">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="card-footer-pills">
                <span className="tag-pill-solid">Videos</span>
                <button 
                  onClick={onOpenCreateNote}
                  className="see-more-pill"
                >
                  <span>See more</span>
                  <Play className="w-2.5 h-2.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Bottom Right Group: Chat Card + Our Snaps */}
            <div className="card-right-group">
              
              {/* CHAT Whispers Card */}
              <div className="card-chat-whispers">
                {/* Pinned Crimson Silk Bow Accent */}
                <div className="chat-pinned-bow">
                  <img 
                    src="/assets/crimson_bow.jpg" 
                    alt="Crimson Silk Bow" 
                    className="bow-icon-img"
                  />
                </div>

                <div className="chat-top-label">
                  <span className="chat-badge-pill">CHAT</span>
                </div>

                <div className="chat-items-list">
                  {notes.length === 0 ? (
                    <div className="chat-empty-state">
                      <p className="chat-empty-msg">No whispers posted yet.</p>
                      <button 
                        onClick={onOpenCreateNote} 
                        className="chat-empty-write-btn"
                      >
                        + Write a whisper
                      </button>
                    </div>
                  ) : (
                    notes.slice(0, 4).map((note, idx) => {
                      const senderUser = users.find(
                        (u) => 
                          u.display_name?.toLowerCase() === note.sender_name?.toLowerCase() ||
                          u.username?.toLowerCase() === note.sender_name?.toLowerCase() ||
                          (note.sender_name?.toLowerCase() === 'her' && (u.username === 'her' || Number(u.id) === 2)) ||
                          (note.sender_name?.toLowerCase() === 'me' && (u.username === 'me' || Number(u.id) === 1))
                      );
                      const avatarImg = senderUser?.avatar_url || senderUser?.profile_pic_url || (note.sender_name === 'Her'
                        ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

                      return (
                        <div 
                          key={note.id || idx}
                          className={`chat-message-row cursor-pointer ${idx === 0 ? 'pinned' : ''}`}
                          onClick={onOpenCreateNote}
                          title="Click to reply or write note"
                        >
                          <img 
                            src={avatarImg} 
                            alt={note.sender_name} 
                            className="chat-avatar-thumb"
                          />
                          <div className="chat-content-box">
                            <div className="chat-name-row">
                              <span className="chat-sender-name">{note.sender_name}</span>
                              {idx === 0 && <Pin className="w-2.5 h-2.5 text-[#851722] fill-current" />}
                              <span className="chat-time-tag">
                                {new Date(note.created_at || Date.now()).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="chat-message-text">{note.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Our Snaps / Camera Grid Card */}
              <div className="card-our-snaps">
                <div className="snaps-camera-badge" title="Our Snaps">
                  <Camera className="w-3.5 h-3.5 text-[#5C1217]" />
                </div>

                <div className="snaps-thumbnails-grid">
                  <div 
                    className="snap-thumb-item cursor-pointer"
                    onClick={() => onSelectPhotoPreview('/assets/strawberry_snacks.jpg', 'Heart Yogurt & Strawberry Toast Treats')}
                  >
                    <img 
                      src="/assets/strawberry_snacks.jpg" 
                      alt="Romantic Strawberry breakfast snacks" 
                      className="snap-img"
                    />
                  </div>
                  <div 
                    className="snap-thumb-item cursor-pointer"
                    onClick={() => onSelectPhotoPreview('/assets/heart_coffee_breakfast.jpg', 'Heart Coffee Moments')}
                  >
                    <img 
                      src="/assets/heart_coffee_breakfast.jpg" 
                      alt="Heart coffee plate" 
                      className="snap-img"
                    />
                  </div>
                </div>

                <button 
                  onClick={onOpenCreateNote}
                  className="snap-add-btn"
                  title="Add New Photo / Note"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

            </div>
          </section>
        </main>

        {/* Romantic Bottom Capsule Footer */}
        <footer className="scrapbook-bottom-footer">
          <div className="footer-capsule-pill">
            <span>Echo & Note &bull; A shared sanctuary for two hearts &bull; Forever & Always ♡</span>
          </div>
        </footer>
      </div>

      {/* Voice Memo Modal */}
      {activeVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="voice-memo-modal-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#851722]" />
                <h3 className="cursive-title text-2xl text-[#5C1217]">Sweet Voice Whispers</h3>
              </div>
              <button onClick={() => setActiveVoiceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Leave a gentle voice note or listen to the soothing melody playing in your morning playlist.
            </p>
            <div className="flex items-center justify-center p-6 bg-[#FFF8F8] rounded-2xl border border-[#F0D5D8] mb-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#851722] text-white flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <Volume2 className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-[#5C1217]">{currentTrack.title}</span>
                <p className="text-xs text-gray-500">{currentTrack.artist}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                togglePlay();
                setActiveVoiceModal(false);
              }}
              className="w-full py-2.5 bg-[#851722] hover:bg-[#681119] text-white rounded-full text-xs font-semibold uppercase tracking-wider"
            >
              {isPlaying ? 'Pause Melody' : 'Play Melody Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
