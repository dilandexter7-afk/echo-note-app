import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Sparkles, User, Heart, Loader2 } from 'lucide-react';

const STATUS_PRESETS = [
  "Always thinking of you ✨",
  "My favorite human & sanctuary 🌙",
  "Forever grateful for your love 💕",
  "Loving you more each day 🌹",
  "Safe and warm in your heart 🤍"
];

const DEFAULT_AVATARS = {
  Me: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  Her: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
};

export default function ProfileDashboardModal({
  isOpen,
  onClose,
  users = [],
  activeUser = 'Me',
  onSaveProfile,
  onSelectActiveUser
}) {
  const [selectedUserName, setSelectedUserName] = useState(activeUser);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  const targetUsername = selectedUserName.toLowerCase();
  const currentUserObj = users.find(
    (u) =>
      u.username?.toLowerCase() === targetUsername ||
      u.display_name?.toLowerCase() === targetUsername ||
      (targetUsername === 'me' && (Number(u.id) === 1 || u.username === 'me')) ||
      (targetUsername === 'her' && (Number(u.id) === 2 || u.username === 'her'))
  ) || (selectedUserName === 'Her' ? users[1] : users[0]) || {
    id: selectedUserName === 'Her' ? 2 : 1,
    username: targetUsername,
    display_name: selectedUserName,
    profile_pic_url: DEFAULT_AVATARS[selectedUserName] || DEFAULT_AVATARS.Me,
    avatar_url: DEFAULT_AVATARS[selectedUserName] || DEFAULT_AVATARS.Me,
    bio: ''
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedUserName(activeUser);
    }
  }, [isOpen, activeUser]);

  useEffect(() => {
    if (currentUserObj) {
      setDisplayName(currentUserObj.display_name || '');
      setBio(currentUserObj.bio || '');
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [selectedUserName, isOpen, currentUserObj?.id, currentUserObj?.profile_pic_url, currentUserObj?.avatar_url, currentUserObj?.display_name]);

  if (!isOpen) return null;

  const currentAvatar = 
    previewUrl || 
    currentUserObj.avatar_url || 
    currentUserObj.profile_pic_url || 
    DEFAULT_AVATARS[selectedUserName] || 
    DEFAULT_AVATARS.Me;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 10MB');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onSaveProfile({
        userId: currentUserObj.id,
        displayName: displayName.trim(),
        username: currentUserObj.username || selectedUserName.toLowerCase(),
        bio: bio.trim(),
        file: selectedFile
      });
      setSuccessMsg('Profile updated gracefully! 🌹');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-header-title-wrap">
            <Heart className="profile-title-heart-icon" />
            <h2 className="cursive-title profile-main-title">Sanctuary Profiles</h2>
          </div>
          <button onClick={onClose} className="profile-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Partner Select Tabs */}
        <div className="profile-partner-pills-row">
          <button
            type="button"
            className={`profile-partner-tab-btn ${selectedUserName === 'Me' ? 'active' : ''}`}
            onClick={() => {
              setSelectedUserName('Me');
              if (onSelectActiveUser) onSelectActiveUser('Me');
            }}
          >
            <span className="partner-tab-title">Me</span>
            <span className="partner-tab-sub">Edit Profile</span>
          </button>
          <button
            type="button"
            className={`profile-partner-tab-btn ${selectedUserName === 'Her' ? 'active' : ''}`}
            onClick={() => {
              setSelectedUserName('Her');
              if (onSelectActiveUser) onSelectActiveUser('Her');
            }}
          >
            <span className="partner-tab-title">Her</span>
            <span className="partner-tab-sub">Edit Profile</span>
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Avatar Upload */}
          <div className="profile-avatar-center">
            <div className="profile-avatar-wrapper">
              <img
                src={currentAvatar}
                alt={displayName}
                className="profile-avatar-img"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="profile-avatar-camera-btn"
                title="Change Avatar Photo"
              >
                <Camera size={14} className="text-white" />
              </button>
            </div>
            
            {/* Hidden file input with explicit display none */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <div className="profile-role-badge">
              <span>Editing profile for <strong>{selectedUserName}</strong></span>
            </div>
          </div>

          {errorMsg && <div className="profile-alert error">{errorMsg}</div>}
          {successMsg && <div className="profile-alert success">{successMsg}</div>}

          {/* Profile Details Form */}
          <form onSubmit={handleSave} className="profile-form">
            <div className="profile-field">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name (e.g. My Love)"
                className="profile-input-text"
                required
              />
            </div>

            <div className="profile-field">
              <label>Romantic Status / Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Write a sweet status or romantic reminder for your partner..."
                className="profile-textarea-bio"
              />
            </div>

            {/* Presets */}
            <div className="profile-presets-section">
              <span className="profile-presets-title">Sweet suggestions:</span>
              <div className="profile-presets-list">
                {STATUS_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBio(preset)}
                    className="profile-preset-pill"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="profile-save-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
