import React, { useState } from 'react';
import { Copy, Check, Link2, X } from 'lucide-react';

interface ShareModalProps {
  type: 'r' | 'l'; // 'r' for review/diary entry, 'l' for list
  id: number;
  shareToken: string;
  title: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ type, id, shareToken, title, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/vault/${type}/${id}?token=${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link2 size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Secret Vault Share Link</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            This item (<strong style={{ color: 'var(--text-main)' }}>{title}</strong>) is <strong style={{ color: 'var(--accent-cyan)' }}>UNLISTED</strong>.
            Anyone who holds this secret link can view it without needing an account. It remains hidden from all search feeds and public profiles.
          </p>

          <div className="form-group">
            <label>Direct Share URL</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="share-link-input"
                readOnly
                value={shareUrl}
                className="form-input"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`btn ${copied ? 'btn-gold' : 'btn-primary'}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
