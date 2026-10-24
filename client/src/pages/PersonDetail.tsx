import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Film, Star, Calendar, MapPin, Award, Loader2 } from 'lucide-react';
import { PersonDetail as PersonDetailType, Movie, api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PersonDetailProps {
  personId: number;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onLogMovie?: (movie: Movie) => void;
}

export const PersonDetail: React.FC<PersonDetailProps> = ({
  personId,
  onBack,
  onSelectMovie,
  onLogMovie
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<PersonDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cast' | 'crew'>('crew');
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getPersonDetail(personId)
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        // Default to whichever has credits
        if (res.crew_credits.length > 0 && res.person.known_for_department === 'Directing') {
          setActiveTab('crew');
        } else if (res.cast_credits.length > 0) {
          setActiveTab('cast');
        } else {
          setActiveTab('crew');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load artist details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--accent-gold)" />
        <p style={{ color: 'var(--text-muted)' }}>Loading artist filmography...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 800, margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#f87171', marginBottom: '1.5rem' }}>{error || 'Artist not found.'}</p>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const { person, cast_credits, crew_credits, stats } = data;

  const profileUrl = person.profile_path
    ? (person.profile_path.startsWith('http') ? person.profile_path : `https://image.tmdb.org/t/p/w400${person.profile_path}`)
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  const displayedCredits = activeTab === 'crew' ? crew_credits : cast_credits;

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '170px 1fr',
          gap: '2.5rem',
          alignItems: 'center',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2.5rem'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--accent-cyan)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 229, 255, 0.25)',
              flexShrink: 0
            }}
          >
            <img
              src={profileUrl}
              alt={person.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 179, 53, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
                  color: 'var(--accent-gold)',
                  border: '1px solid rgba(245, 179, 53, 0.35)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {person.known_for_department || 'Filmmaker'}
              </span>
            </div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
              {person.name}
            </h1>
          </div>

          {/* Meta details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {person.birthday && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} color="var(--accent-gold)" />
                Born {person.birthday}
              </span>
            )}
            {person.place_of_birth && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={15} color="var(--accent-gold)" />
                {person.place_of_birth}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Film size={15} color="var(--accent-gold)" />
              {stats.total_films} Known Credits
            </span>
          </div>

          {/* Biography */}
          {person.biography && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <p>
                {showFullBio || person.biography.length <= 320
                  ? person.biography
                  : `${person.biography.slice(0, 320)}...`}
              </p>
              {person.biography.length > 320 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: 0,
                    marginTop: '0.35rem'
                  }}
                >
                  {showFullBio ? 'Show Less' : 'Read Full Bio'}
                </button>
              )}
            </div>
          )}

          {/* % Watched by You Progress Bar Widget */}
          <div
            style={{
              marginTop: '0.5rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--accent-gold)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Watched by You
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {stats.watched_films} of {stats.total_films} films
                </span>
                <span
                  style={{
                    background: stats.percent_watched >= 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(217, 119, 6, 0.2)',
                    color: stats.percent_watched >= 50 ? '#22c55e' : 'var(--accent-gold)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {stats.percent_watched}%
                </span>
              </div>
            </div>

            {/* Progress Bar Track */}
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stats.percent_watched}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-gold), #22c55e)',
                  borderRadius: 999,
                  transition: 'width 0.8s ease'
                }}
              />
            </div>
            {!user && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Log in to track your personal completion progress for this filmmaker.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filmography Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Filmography</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {crew_credits.length > 0 && (
              <button
                onClick={() => setActiveTab('crew')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'crew' ? 'var(--accent-gold)' : 'var(--bg-input)',
                  color: activeTab === 'crew' ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Directing & Crew ({crew_credits.length})
              </button>
            )}
            {cast_credits.length > 0 && (
              <button
                onClick={() => setActiveTab('cast')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'cast' ? 'var(--accent-gold)' : 'var(--bg-input)',
                  color: activeTab === 'cast' ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Acting ({cast_credits.length})
              </button>
            )}
          </div>
        </div>

        {/* Film Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {displayedCredits.map((credit) => {
            const posterUrl = credit.poster_path
              ? (credit.poster_path.startsWith('http') ? credit.poster_path : `https://image.tmdb.org/t/p/w300${credit.poster_path}`)
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';

            return (
              <div
                key={`${credit.tmdb_id}-${credit.job || credit.character_name || ''}`}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: credit.watched ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() =>
                  onSelectMovie({
                    tmdb_id: credit.tmdb_id,
                    title: credit.title,
                    release_year: credit.release_year,
                    poster_path: credit.poster_path,
                    rating: credit.rating
                  })
                }
              >
                <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                  <img
                    src={posterUrl}
                    alt={credit.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Watched Badge */}
                  {credit.watched && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(34, 197, 94, 0.9)',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <CheckCircle2 size={12} /> Watched
                    </div>
                  )}

                  {/* User Rating if Watched */}
                  {credit.user_rating && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(217, 119, 6, 0.4)',
                        color: 'var(--accent-gold)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Star size={11} fill="var(--accent-gold)" />
                      {credit.user_rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        marginBottom: '0.25rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {credit.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {credit.release_year || 'TBA'}
                      {credit.job ? ` • ${credit.job}` : ''}
                      {credit.character_name ? ` as ${credit.character_name}` : ''}
                    </p>
                  </div>

                  {onLogMovie && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogMovie({
                          tmdb_id: credit.tmdb_id,
                          title: credit.title,
                          release_year: credit.release_year,
                          poster_path: credit.poster_path
                        });
                      }}
                      className="btn btn-secondary"
                      style={{
                        marginTop: '0.6rem',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.72rem',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      {credit.watched ? 'Log Again' : '+ Log Film'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
