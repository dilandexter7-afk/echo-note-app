import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Mail, MailOpen, Lock, Heart, Plus, Sparkles, X, Clock, Send, ShieldAlert } from 'lucide-react';

const PRESET_TRIGGERS = [
  "Open when you miss me most",
  "Open when you had an exhausting day",
  "Open when you need a reminder why I love you",
  "Open when you can't sleep at night",
  "Open when you are feeling anxious or overwhelmed",
  "Open when we had a little misunderstanding",
  "Open on our anniversary"
];

export default function LetterVault({ letters = [], onOpenLetter, onSealLetter, activeUser, isLoading }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'sealed' | 'opened'
  const [activeLetter, setActiveLetter] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Compose form state
  const [triggerLabel, setTriggerLabel] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [formError, setFormError] = useState('');

  // Filter letters defensively
  const safeLetters = Array.isArray(letters) ? letters : [];
  const filteredLetters = safeLetters.filter((l) => {
    if (filter === 'sealed') return !l.is_opened;
    if (filter === 'opened') return l.is_opened;
    return true;
  });

  const handleEnvelopeClick = async (letter) => {
    setActiveLetter(letter);

    // If letter was not yet opened, trigger opening sequence
    if (!letter.is_opened) {
      try {
        // Trigger romantic confetti burst
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#FB7185', '#E11D48', '#FDE68A']
        });
        await onOpenLetter(letter.id);
      } catch (err) {
        console.error('Failed to mark letter opened:', err);
      }
    }
  };

  const handleCreateLetter = async (e) => {
    e.preventDefault();
    if (!triggerLabel.trim()) {
      setFormError('Please choose or write an "Open when..." prompt');
      return;
    }
    if (!letterContent.trim()) {
      setFormError('Please write your heartfelt letter message');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSealLetter({
        sender_name: activeUser,
        trigger_label: triggerLabel.trim(),
        content: letterContent.trim()
      });
      // Reset and close
      setTriggerLabel('');
      setLetterContent('');
      setIsComposing(false);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#10B981', '#60A5FA']
      });
    } catch (err) {
      setFormError(err.message || 'Failed to seal letter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vault-section">
      {/* Vault Header / Toolbar */}
      <div className="vault-toolbar">
        <div className="vault-intro">
          <div className="vault-title-wrap">
            <Mail className="vault-icon text-amber" size={24} />
            <h2>"Open-When" Letter Vault</h2>
          </div>
          <p className="vault-subtitle">
            Sealed digital envelopes waiting for the exact moment you need them most.
          </p>
        </div>

        <button 
          className="btn-seal-new"
          onClick={() => {
            setIsComposing(true);
            setFormError('');
          }}
        >
          <Plus size={18} />
          <span>Seal a New Letter</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="vault-filter-tabs">
        <button
          className={`vault-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Letters ({safeLetters.length})
        </button>
        <button
          className={`vault-tab ${filter === 'sealed' ? 'active' : ''}`}
          onClick={() => setFilter('sealed')}
        >
          <Lock size={14} className="tab-icon" />
          Sealed ({safeLetters.filter(l => !l.is_opened).length})
        </button>
        <button
          className={`vault-tab ${filter === 'opened' ? 'active' : ''}`}
          onClick={() => setFilter('opened')}
        >
          <MailOpen size={14} className="tab-icon" />
          Opened ({safeLetters.filter(l => l.is_opened).length})
        </button>
      </div>

      {/* Letters Grid */}
      {isLoading ? (
        <div className="loading-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="envelope-skeleton skeleton" />
          ))}
        </div>
      ) : filteredLetters.length === 0 ? (
        <div className="vault-empty-state">
          <div className="empty-icon-wrap">
            <Mail size={40} className="empty-icon" />
          </div>
          <h3>No letters in this section</h3>
          <p>
            {filter === 'sealed' 
              ? 'All current letters have been opened! Why not seal a sweet new surprise?' 
              : 'Write your first "Open When..." letter to surprise your partner!'}
          </p>
          <button 
            className="btn-secondary"
            onClick={() => setIsComposing(true)}
          >
            Seal a Letter Now
          </button>
        </div>
      ) : (
        <div className="envelopes-grid">
          {filteredLetters.map((letter) => {
            const isOpened = letter.is_opened;
            return (
              <div
                key={letter.id}
                className={`envelope-card ${isOpened ? 'opened' : 'sealed'}`}
                onClick={() => handleEnvelopeClick(letter)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleEnvelopeClick(letter)}
              >
                {/* Envelope Top Flap styling */}
                <div className="envelope-flap" />
                
                {/* Wax Seal / Stamp */}
                <div className="wax-seal">
                  {isOpened ? (
                    <MailOpen size={20} className="wax-icon opened" />
                  ) : (
                    <div className="wax-seal-inner">
                      <Heart size={18} fill="#E11D48" color="#E11D48" />
                    </div>
                  )}
                </div>

                <div className="envelope-content-preview">
                  <span className="envelope-badge">
                    {isOpened ? 'Opened Letter 💌' : 'Locked Envelope 🔒'}
                  </span>
                  <h3 className="envelope-trigger">"{letter.trigger_label}"</h3>
                  <div className="envelope-meta">
                    <span className="envelope-from">From: <strong>{letter.sender_name}</strong></span>
                    {isOpened && letter.opened_at && (
                      <span className="envelope-date">
                        Opened {new Date(letter.opened_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="envelope-footer-prompt">
                  {isOpened ? (
                    <span>Click to read again</span>
                  ) : (
                    <span className="pulse-prompt">Click to unseal & reveal ✨</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Read Letter */}
      {activeLetter && (
        <div className="modal-overlay" onClick={() => setActiveLetter(null)}>
          <div 
            className="letter-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="modal-close-btn"
              onClick={() => setActiveLetter(null)}
              aria-label="Close letter"
            >
              <X size={20} />
            </button>

            <div className="letter-paper">
              <div className="letter-header">
                <div className="letter-tag">
                  <Sparkles size={16} className="text-amber" />
                  <span>Open When...</span>
                </div>
                <h2 className="letter-prompt-title">"{activeLetter.trigger_label}"</h2>
                <div className="letter-author-info">
                  Written with love by <strong>{activeLetter.sender_name}</strong>
                  {activeLetter.created_at && (
                    <span className="letter-time">
                      • {new Date(activeLetter.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                    </span>
                  )}
                </div>
              </div>

              <div className="letter-body">
                <p className="letter-text">{activeLetter.content}</p>
              </div>

              <div className="letter-stamp-sign">
                <Heart size={24} fill="#F43F5E" color="#F43F5E" className="heart-beat" />
                <div className="sign-off">
                  <p>Forever yours,</p>
                  <h4>{activeLetter.sender_name}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Compose New Letter */}
      {isComposing && (
        <div className="modal-overlay" onClick={() => setIsComposing(false)}>
          <div 
            className="modal-compose-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-compose-header">
              <div className="modal-title-wrap">
                <Mail size={22} className="text-amber" />
                <h3>Seal a Secret "Open-When" Letter</h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setIsComposing(false)}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert-error">
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLetter} className="compose-form">
              <div className="form-group">
                <label>When should your partner open this?</label>
                <input
                  type="text"
                  placeholder='e.g., "Open when you miss me" or select a preset below'
                  value={triggerLabel}
                  onChange={(e) => setTriggerLabel(e.target.value)}
                  className="input-field"
                  maxLength={120}
                  required
                />
                
                {/* Preset suggestions */}
                <div className="trigger-presets">
                  <span className="preset-label">Quick Ideas:</span>
                  <div className="preset-pills">
                    {PRESET_TRIGGERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`preset-pill ${triggerLabel === preset ? 'selected' : ''}`}
                        onClick={() => setTriggerLabel(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>The Secret Letter Content</label>
                <textarea
                  placeholder="Pour your heart out. Tell them what they mean to you, share reassurance, or leave a loving message for that exact moment..."
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  className="textarea-field letter-textarea"
                  rows={6}
                  required
                />
              </div>

              <div className="compose-footer">
                <div className="sender-note">
                  Sealing as: <strong>{activeUser}</strong>
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setIsComposing(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'Sealing...' : 'Seal with Love'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
