import React from 'react';
import { Lock, Link2, Globe } from 'lucide-react';

interface PrivacyBadgeProps {
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  showLabel?: boolean;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ visibility, showLabel = true }) => {
  const getIcon = () => {
    switch (visibility) {
      case 'PRIVATE':
        return <Lock size={12} strokeWidth={2.5} />;
      case 'UNLISTED':
        return <Link2 size={12} strokeWidth={2.5} />;
      case 'PUBLIC':
      default:
        return <Globe size={12} strokeWidth={2.5} />;
    }
  };

  return (
    <span className={`badge-privacy ${visibility}`} title={`Visibility: ${visibility}`}>
      {getIcon()}
      {showLabel && <span>{visibility}</span>}
    </span>
  );
};
