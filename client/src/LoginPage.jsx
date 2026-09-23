import React, { useState } from 'react';
import { Heart, Lock, User, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';

export default function LoginPage({ onLogin, loading, error }) {
  const [username, setUsername] = useState('me');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onLogin(username.trim().toLowerCase(), password);
  };

  const handleQuickSelect = (user, defaultPass) => {
    setUsername(user);
    setPassword(defaultPass);
  };

  return (
    <div className="login-page-container">
      {/* Background aesthetic shadow & ribbon accents */}
      <div className="shadow-overlay-layer" />
      <img src="/assets/crimson_ribbon.jpg" alt="Ribbon Accent" className="bg-ribbon-top-right" />
      <img src="/assets/crimson_ribbon.jpg" alt="Ribbon Accent" className="bg-ribbon-bottom-left" />

      <div className="login-card-wrapper">
        {/* Top Collab Banner */}
        <div className="collab-pill-banner login-collab-badge">
          <span>~ COLLAB MODE: SIGN IN ~</span>
        </div>

        <div className="login-aesthetic-card">
          {/* Header */}
          <div className="login-header-group">
            <div className="login-heart-badge">
              <Heart className="w-6 h-6 fill-current text-[#751820]" />
            </div>
            <h1 className="cursive-title text-4xl text-[#5C1217] mt-3">Echo & Note</h1>
            <p className="login-subtitle">Our private shared sanctuary for two</p>
          </div>

          {/* Quick Partner Switcher Pills */}
          <div className="login-partner-pills">
            <button
              type="button"
              className={`login-partner-btn ${username === 'me' ? 'active' : ''}`}
              onClick={() => handleQuickSelect('me', 'me123')}
            >
              <span>Me</span>
              <span className="text-xs opacity-75">me123</span>
            </button>
            <button
              type="button"
              className={`login-partner-btn ${username === 'her' ? 'active' : ''}`}
              onClick={() => handleQuickSelect('her', 'her123')}
            >
              <span>Her</span>
              <span className="text-xs opacity-75">her123</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error-alert">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-field">
              <label>Username</label>
              <div className="login-input-box">
                <User className="w-4 h-4 text-[#851722]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (me or her)"
                  required
                />
              </div>
            </div>

            <div className="login-input-field">
              <label>Password</label>
              <div className="login-input-box">
                <Lock className="w-4 h-4 text-[#851722]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-crimson-btn"
            >
              {loading ? (
                <span>Entering Sanctuary...</span>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Enter Our Sanctuary</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer-hint">
            <p className="text-xs text-gray-500">
              Default access: <strong>me</strong> / <code>me123</code> &bull; <strong>her</strong> / <code>her123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
