import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../contexts/UserContext';
import { useLikeEvent } from '../../hooks/useEvents';
import styles from './EventCard.module.css';

const CATEGORY_COLORS = {
  Technology: '#4f8ef7',
  Music: '#c157e8',
  Sports: '#27ae78',
  Arts: '#e8a020',
  default: '#e85d26',
};

const EventCard = memo(function EventCard({ event }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useUser();
  const likeMutation = useLikeEvent();

  const liked = isFavorite(event.id);
  const lowestPrice = event.ticketTypes?.reduce((min, t) => Math.min(min, t.price), Infinity);
  const categoryColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const handleFav = (e) => {
    e.stopPropagation();
    const isCurrentlyLiked = liked;
    const newLikes = isCurrentlyLiked
      ? Math.max(0, (event.likes || 0) - 1)
      : (event.likes || 0) + 1;

    toggleFavorite(event.id);
    likeMutation.mutate({ id: event.id, likes: newLikes });
  };

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/events/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/events/${event.id}`)}
      aria-label={`View details for ${event.title}`}
    >
      <div className={styles.imageWrap}>
        <img
          src={event.image}
          alt={event.title}
          className={styles.image}
          loading="lazy"
        />
        <span className={styles.category} style={{ '--cat-color': categoryColor }}>
          {event.category}
        </span>
        <button
          className={`${styles.favBtn} ${liked ? styles.liked : ''}`}
          onClick={handleFav}
          aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {event.likes !== undefined && (
            <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>{event.likes}</span>
          )}
        </button>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formattedDate}
          </span>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {event.location}
          </span>
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>
            {lowestPrice === 0 ? (
              <span className={styles.free}>Free</span>
            ) : (
              <>from <strong>${lowestPrice}</strong></>
            )}
          </span>
          <span className={styles.cta}>View Details →</span>
        </div>
      </div>
    </article>
  );
});

export default EventCard;
