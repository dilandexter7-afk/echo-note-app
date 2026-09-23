import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ScrapbookDashboard from './ScrapbookDashboard';
import LetterVault from './LetterVault';
import ProfileDashboardModal from './ProfileDashboardModal';
import { 
  Heart, 
  Camera, 
  Image as ImageIcon, 
  Send, 
  Sparkles, 
  Smile, 
  Quote, 
  Music, 
  Trash2, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Loader2,
  BookOpen,
  Mail,
  LayoutGrid,
  Settings,
  Plus
} from 'lucide-react';

const CATEGORIES = [
  { id: 'thought', label: 'Thought', icon: '💭' },
  { id: 'love', label: 'Love Note', icon: '💌' },
  { id: 'memory', label: 'Memory', icon: '✨' },
  { id: 'quote', label: 'Quote', icon: '📖' },
  { id: 'joke', label: 'Inside Joke', icon: '😂' },
  { id: 'song', label: 'Song', icon: '🎵' }
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  // Active Poster: 'Me' or 'Her'
  const [activeUser, setActiveUser] = useState('Me');

  // Navigation: 'dashboard' (Pinterest layout), 'feed' (all notes), 'vault' (letters)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [letters, setLetters] = useState([]);

  // Modals & Popups
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null); // { url, title }
  const [toast, setToast] = useState(null);

  // Note Creation Form State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('love');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  // Feed Filter States
  const [activeFilterCategory, setActiveFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedNotes, setLikedNotes] = useState(new Set());

  const fileInputRef = useRef(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, notesRes, lettersRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/users`),
        fetch(`${API_BASE}/api/notes`),
        fetch(`${API_BASE}/api/letters`)
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const u = await usersRes.value.json();
        const formatted = Array.isArray(u) ? u.map(user => ({
          ...user,
          avatar_url: user.profile_pic_url || user.avatar_url
        })) : [];
        setUsers(formatted);
      }
      if (notesRes.status === 'fulfilled' && notesRes.value.ok) {
        const n = await notesRes.value.json();
        setNotes(Array.isArray(n) ? n : []);
      }
      if (lettersRes.status === 'fulfilled' && lettersRes.value.ok) {
        const l = await lettersRes.value.json();
        setLetters(Array.isArray(l) ? l : []);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // Handle Note File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Photo must be less than 10MB', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Note
  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() && !selectedFile) {
      showToast('Please write a note or attach an image', 'error');
      return;
    }

    setIsPosting(true);
    const formData = new FormData();
    formData.append('sender_name', activeUser);
    formData.append('content', newNoteContent.trim());
    formData.append('category', newNoteCategory);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post note');
      }

      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
      setNewNoteContent('');
      handleRemoveImage();
      setIsCreateNoteOpen(false);
      showToast('Note posted to our sanctuary! 🌹');
    } catch (err) {
      showToast(err.message || 'Error posting note', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Delete this note by ${note.sender_name}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/notes/${note.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      showToast('Note removed gracefully');
    } catch (err) {
      showToast('Could not delete note', 'error');
    }
  };

  // Toggle Like on note
  const toggleLike = (noteId) => {
    setLikedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  // Profile Save
  const handleSaveProfile = async ({ userId, displayName, username, bio, file }) => {
    const formData = new FormData();
    formData.append('display_name', displayName);
    formData.append('username', username || activeUser.toLowerCase());
    formData.append('bio', bio);
    if (file) {
      formData.append('image', file);
    }

    const res = await fetch(`${API_BASE}/api/users/${userId}`, {
      method: 'PUT',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update profile');
    }

    const updatedUser = await res.json();
    const formattedUser = {
      ...updatedUser,
      avatar_url: updatedUser.profile_pic_url || updatedUser.avatar_url
    };
    setUsers((prev) => prev.map((u) => (Number(u.id) === Number(userId) ? formattedUser : u)));
    showToast('Profile updated gracefully! 🌹');
  };

  // Letter Vault actions
  const handleOpenLetter = async (letterId) => {
    try {
      const res = await fetch(`${API_BASE}/api/letters/${letterId}/open`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setLetters((prev) => prev.map((l) => (l.id === letterId ? updated : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSealLetter = async (letterData) => {
    const res = await fetch(`${API_BASE}/api/letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(letterData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to seal letter');
    }

    const created = await res.json();
    setLetters((prev) => [created, ...prev]);
    showToast('Love letter sealed with care 💌');
  };

  // Filter notes by search & category
  const filteredNotes = notes.filter((n) => {
    const matchesCat = activeFilterCategory === 'all' || n.category === activeFilterCategory;
    const matchesQuery = 
      !searchQuery.trim() || 
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sender_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const currentUserObj = users.find(
    (u) => 
      u.username?.toLowerCase() === activeUser.toLowerCase() ||
      u.display_name?.toLowerCase() === activeUser.toLowerCase() ||
      (activeUser === 'Me' && (Number(u.id) === 1 || u.username === 'me')) ||
      (activeUser === 'Her' && (Number(u.id) === 2 || u.username === 'her'))
  ) || {
    display_name: activeUser,
    avatar_url: activeUser === 'Me' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  };

  return (
    <div className="app-main-viewport">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#5C1217] rounded-full shadow-lg animate-fadeIn text-xs font-semibold text-[#5C1217]">
          <Heart className="w-3.5 h-3.5 fill-[#851722] text-[#851722]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Router */}
      {activeTab === 'dashboard' && (
        <ScrapbookDashboard
          activeUser={activeUser}
          onToggleUser={() => setActiveUser((prev) => (prev === 'Me' ? 'Her' : 'Me'))}
          users={users}
          notes={notes}
          onOpenCreateNote={() => setIsCreateNoteOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onViewFeed={() => setActiveTab('feed')}
          onViewVault={() => setActiveTab('vault')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectPhotoPreview={(url, title) => setPhotoPreview({ url, title })}
        />
      )}

      {activeTab === 'feed' && (
        <div className="feed-page-root">
          <div className="feed-inner-container">
            {/* Top Navigation Bar */}
            <div className="scrapbook-top-bar">
              <div className="search-capsule-wrapper">
                <Search className="search-icon text-[#5C1217] w-4 h-4" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search our notes & memories..."
                  className="search-capsule-input"
                />
              </div>

              <div className="top-action-capsules">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="action-nav-pill"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#5C1217]" />
                  <span>Dashboard</span>
                </button>

                <button 
                  onClick={() => setActiveTab('vault')}
                  className="action-nav-pill"
                >
                  <Mail className="w-3.5 h-3.5 text-[#5C1217]" />
                  <span>Letters</span>
                </button>

                <button 
                  onClick={() => {
                    if (activeFilterCategory !== 'all') {
                      setNewNoteCategory(activeFilterCategory);
                    }
                    setIsCreateNoteOpen(true);
                  }}
                  className="action-nav-pill active"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>New Note</span>
                </button>

                <button 
                  onClick={() => setActiveUser((prev) => (prev === 'Me' ? 'Her' : 'Me'))}
                  className="action-nav-pill profile-pill"
                  title="Click to switch posting partner"
                >
                  <img 
                    src={currentUserObj?.avatar_url} 
                    alt={activeUser} 
                    className="user-nav-avatar"
                  />
                  <span className="font-semibold text-[#5C1217]">{activeUser}</span>
                  <span className="text-[10px] opacity-60 ml-0.5">⇄ Switch</span>
                </button>

                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="action-nav-pill"
                  title="Edit Profiles"
                >
                  <Settings className="w-3.5 h-3.5 text-[#5C1217]" />
                  <span className="hidden sm:inline">Profiles</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="category-filter-row">
              <button 
                onClick={() => setActiveFilterCategory('all')}
                className={`category-filter-pill ${activeFilterCategory === 'all' ? 'active' : ''}`}
              >
                <span>All Notes ({notes.length})</span>
              </button>
              {CATEGORIES.map((cat) => {
                const count = notes.filter((n) => n.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilterCategory(cat.id)}
                    className={`category-filter-pill ${activeFilterCategory === cat.id ? 'active' : ''}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Notes Scrapbook Grid */}
            <div className="notes-scrapbook-grid">
              {filteredNotes.length === 0 ? (
                <div className="feed-empty-state">
                  <Heart className="feed-empty-icon" />
                  <h3 className="cursive-title feed-empty-title">
                    {activeFilterCategory === 'all' 
                      ? 'No notes found' 
                      : `No ${CATEGORIES.find(c => c.id === activeFilterCategory)?.label || 'notes'} yet`}
                  </h3>
                  <p className="feed-empty-subtitle">
                    {activeFilterCategory === 'all'
                      ? 'Be the first to leave a sweet whisper in our sanctuary.'
                      : `Pour your heart out and add our first ${CATEGORIES.find(c => c.id === activeFilterCategory)?.label || 'note'} together.`}
                  </p>
                  <button 
                    onClick={() => {
                      if (activeFilterCategory !== 'all') {
                        setNewNoteCategory(activeFilterCategory);
                      }
                      setIsCreateNoteOpen(true);
                    }}
                    className="feed-empty-btn"
                  >
                    <Plus size={16} />
                    <span>
                      {activeFilterCategory === 'all' 
                        ? 'Write a Note Now' 
                        : `Add ${CATEGORIES.find(c => c.id === activeFilterCategory)?.label || 'Note'} Now`}
                    </span>
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isLiked = likedNotes.has(note.id);
                  const categoryInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];

                  return (
                    <article key={note.id} className="scrapbook-note-card">
                      <div className="note-card-header">
                        <div className="note-author-group">
                          <img 
                            src={
                              users.find(u => 
                                u.display_name?.toLowerCase() === note.sender_name?.toLowerCase() ||
                                u.username?.toLowerCase() === note.sender_name?.toLowerCase() ||
                                (note.sender_name?.toLowerCase() === 'her' && (u.username === 'her' || Number(u.id) === 2)) ||
                                (note.sender_name?.toLowerCase() === 'me' && (u.username === 'me' || Number(u.id) === 1))
                              )?.avatar_url || 
                              users.find(u => 
                                u.display_name?.toLowerCase() === note.sender_name?.toLowerCase() ||
                                u.username?.toLowerCase() === note.sender_name?.toLowerCase()
                              )?.profile_pic_url ||
                              (note.sender_name === 'Her' 
                                ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
                                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80')
                            } 
                            alt={note.sender_name} 
                            className="note-author-avatar"
                          />
                          <span className="note-author-name">{note.sender_name}</span>
                        </div>
                        <span className="note-category-tag">
                          {categoryInfo.icon} {categoryInfo.label}
                        </span>
                      </div>

                      <p className="note-content-text">{note.content}</p>

                      {note.image_url && (
                        <img 
                          src={note.image_url} 
                          alt="Attached memory" 
                          className="note-attached-photo"
                          onClick={() => setPhotoPreview({ url: note.image_url, title: `Memory by ${note.sender_name}` })}
                        />
                      )}

                      <div className="note-card-footer">
                        <span className="note-date-text">
                          {new Date(note.created_at || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>

                        <div className="note-actions-group">
                          <button 
                            onClick={() => toggleLike(note.id)}
                            className={`note-action-btn ${isLiked ? 'liked' : ''}`}
                            title="Cherish Note"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#851722] text-[#851722]' : ''}`} />
                          </button>

                          <button 
                            onClick={() => handleDeleteNote(note)}
                            className="note-action-btn hover:text-red-700"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vault' && (
        <div className="feed-page-root">
          <div className="feed-inner-container">
            <div className="scrapbook-top-bar">
              <h2 className="cursive-title text-4xl text-[#5C1217]">The Letter Vault</h2>
              <div className="top-action-capsules">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="action-nav-pill"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#5C1217]" />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveTab('feed')}
                  className="action-nav-pill"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#5C1217]" />
                  <span>Scrapbook</span>
                </button>
              </div>
            </div>

            <LetterVault
              letters={letters}
              activeUser={activeUser}
              onOpenLetter={handleOpenLetter}
              onSealLetter={handleSealLetter}
            />
          </div>
        </div>
      )}

      {/* Note Creation Modal */}
      {isCreateNoteOpen && (
        <div 
          className="composer-modal-overlay" 
          onClick={() => {
            setIsCreateNoteOpen(false);
            handleRemoveImage();
          }}
        >
          <div className="create-note-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="composer-header">
              <div className="composer-title-wrap">
                <Heart className="composer-heart-icon" />
                <h3 className="cursive-title composer-main-title">Whisper from {activeUser}</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCreateNoteOpen(false);
                  handleRemoveImage();
                }} 
                className="profile-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Switch Poster in Composer */}
            <div className="composer-partner-row">
              <span className="composer-partner-label">Posting as:</span>
              <div className="composer-partner-buttons">
                <button
                  type="button"
                  className={`composer-partner-pill ${activeUser === 'Me' ? 'active' : ''}`}
                  onClick={() => setActiveUser('Me')}
                >
                  Me
                </button>
                <button
                  type="button"
                  className={`composer-partner-pill ${activeUser === 'Her' ? 'active' : ''}`}
                  onClick={() => setActiveUser('Her')}
                >
                  Her
                </button>
              </div>
            </div>

            <form onSubmit={handlePostNote}>
              <div className="composer-categories-row">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewNoteCategory(cat.id)}
                    className={`composer-category-btn ${newNoteCategory === cat.id ? 'active' : ''}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your sweet message, romantic quote, or loving reminder..."
                className="composer-textarea"
                rows={4}
                autoFocus
              />

              {previewUrl && (
                <div className="composer-preview-box">
                  <img src={previewUrl} alt="Upload preview" className="composer-preview-img" />
                  <button type="button" onClick={handleRemoveImage} className="composer-remove-img-btn" title="Remove image">
                    <X size={16} />
                  </button>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              <div className="composer-actions-row">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="composer-attach-btn"
                >
                  <Camera size={16} />
                  <span>{selectedFile ? 'Change Photo' : 'Attach Photo'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="composer-submit-btn"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Sealing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Post Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {photoPreview && (
        <div 
          className="lightbox-modal-overlay"
          onClick={() => setPhotoPreview(null)}
        >
          <div className="photo-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <img src={photoPreview.url} alt={photoPreview.title} className="lightbox-img" />
            <div className="lightbox-caption">
              <span>{photoPreview.title}</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Dashboard Modal */}
      <ProfileDashboardModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        users={users}
        activeUser={activeUser}
        onSaveProfile={handleSaveProfile}
        onSelectActiveUser={(name) => setActiveUser(name)}
      />
    </div>
  );
}