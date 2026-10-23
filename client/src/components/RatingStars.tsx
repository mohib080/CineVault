import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number | null;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 18
}) => {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const displayRating = hoverVal !== null ? hoverVal : (value || 0);

  return (
    <div className="star-rating-control" onMouseLeave={() => !readOnly && setHoverVal(null)}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fullStarThreshold = starIndex;
        const halfStarThreshold = starIndex - 0.5;
        const isFull = displayRating >= fullStarThreshold;
        const isHalf = !isFull && displayRating >= halfStarThreshold;

        return (
          <div
            key={starIndex}
            style={{ position: 'relative', display: 'inline-block', cursor: readOnly ? 'default' : 'pointer' }}
          >
            {/* Left half-star hit zone */}
            {!readOnly && (
              <span
                style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }}
                onMouseEnter={() => setHoverVal(starIndex - 0.5)}
                onClick={() => onChange && onChange(starIndex - 0.5)}
              />
            )}

            {/* Right half-star hit zone */}
            {!readOnly && (
              <span
                style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }}
                onMouseEnter={() => setHoverVal(starIndex)}
                onClick={() => onChange && onChange(starIndex)}
              />
            )}

            <Star
              size={size}
              className={`star-btn ${isFull || isHalf ? 'active' : ''}`}
              fill={isFull ? '#f5b335' : isHalf ? 'url(#halfStarGrad)' : 'none'}
              stroke={isFull || isHalf ? '#f5b335' : '#3c4756'}
            />
          </div>
        );
      })}

      {/* SVG linear gradient definition for half-star rendering */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="halfStarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="#f5b335" />
            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {value !== null && value > 0 && (
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f5b335', marginLeft: '6px' }}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};
