import React from 'react';
import { Lock, Link2, Globe } from 'lucide-react';

interface PrivacyToggleProps {
  value: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  onChange: (value: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') => void;
  disabled?: boolean;
}

export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="privacy-toggle-group">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('PRIVATE')}
        className={`privacy-toggle-btn ${value === 'PRIVATE' ? 'active-private' : ''}`}
        title="Only you can see this entry"
      >
        <Lock size={14} />
        <span>Private</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('UNLISTED')}
        className={`privacy-toggle-btn ${value === 'UNLISTED' ? 'active-unlisted' : ''}`}
        title="Accessible only via secret direct share token link"
      >
        <Link2 size={14} />
        <span>Unlisted</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('PUBLIC')}
        className={`privacy-toggle-btn ${value === 'PUBLIC' ? 'active-public' : ''}`}
        title="Visible on your public profile and search feeds"
      >
        <Globe size={14} />
        <span>Public</span>
      </button>
    </div>
  );
};
