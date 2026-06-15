import { Suspense } from 'react';
import { useParams, useNavigate, useLoaderData, Await, useRouteLoaderData } from 'react-router-dom';
import { useEventDetail } from '../../hooks/useEvents';
import { useUser } from '../../contexts/UserContext';
import styles from './EventDetail.module.css';

function StarRating({ rating }) {
  return (
    <span style={{ color: '#f5a623', letterSpacing: '2px' }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewsSkeleton() {
  return (
    <div>
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{
          background: 'var(--surface, var(--bg-card))',
          borderRadius: 'var(--radius, 8px)',
          padding: '1rem',
          marginBottom: '0.75rem',
          height: '80px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

function Reviews({ reviews }) {
  if (!reviews.length) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>
        No reviews yet. Be the first to review this event!
      </p>
    );
  }
  return (
    <div>
      {reviews.map(r => (
        <div key={r.id} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm, 8px)',
          padding: '1rem 1.25rem',
          marginBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{r.author}</strong>
            <StarRating rating={r.rating} />
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

function EventDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useUser();
  const { data: event, isLoading, error } = useEventDetail(id);

  // Deferred data from the route loader
  const loaderData = useLoaderData();

  // Access parent route data via useRouteLoaderData
  const rootData = useRouteLoaderData('root');
  const currentUser = rootData?.user;

  if (isLoading) return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.skeleton} />
      </div>
    </main>
  );

  if (error || !event) return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.error}>
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className={styles.backBtn}>← Back to Events</button>
        </div>
      </div>
    </main>
  );

  const liked = isFavorite(event.id);
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <main className={styles.page}>
      <div className="container">
        <button className={styles.backLink} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className={styles.hero}>
          <img src={event.image} alt={event.title} className={styles.heroImage} />
          <div className={styles.heroOverlay}>
            <span className={styles.category}>{event.category}</span>
            <h1 className={styles.title}>{event.title}</h1>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            {/* Info cards */}
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📅</span>
                <div>
                  <div className={styles.infoLabel}>Date & Time</div>
                  <div className={styles.infoValue}>{formattedDate}</div>
                  <div className={styles.infoSub}>{event.time}</div>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div>
                  <div className={styles.infoLabel}>Location</div>
                  <div className={styles.infoValue}>{event.venue}</div>
                  <div className={styles.infoSub}>{event.location}</div>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🎟</span>
                <div>
                  <div className={styles.infoLabel}>Organizer</div>
                  <div className={styles.infoValue}>{event.organizerName}</div>
                  <div className={styles.infoSub}>{event.organizerEmail}</div>
                </div>
              </div>
            </div>

            {currentUser && (
              <div style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}>
                Browsing as <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name}</strong>
              </div>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About this event</h2>
              <p className={styles.description}>{event.description}</p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Ticket Options</h2>
              <div className={styles.tickets}>
                {event.ticketTypes?.map(ticket => (
                  <div key={ticket.id} className={styles.ticketRow}>
                    <div>
                      <div className={styles.ticketName}>{ticket.name}</div>
                      <div className={styles.ticketAvail}>{ticket.available} remaining</div>
                    </div>
                    <div className={styles.ticketPrice}>
                      {ticket.price === 0 ? <span className={styles.free}>Free</span> : `$${ticket.price}`}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Deferred reviews — streamed after main content */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Reviews</h2>
              {loaderData?.reviews ? (
                <Suspense fallback={<ReviewsSkeleton />}>
                  <Await resolve={loaderData.reviews}>
                    {(reviews) => <Reviews reviews={reviews} />}
                  </Await>
                </Suspense>
              ) : (
                <ReviewsSkeleton />
              )}
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.stickyBox}>
              <button
                className={styles.bookBtn}
                onClick={() => navigate(`/book/${event.id}`)}
              >
                Book Tickets
              </button>
              <button
                className={`${styles.favBtnLarge} ${liked ? styles.liked : ''}`}
                onClick={() => toggleFavorite(event.id)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {liked ? 'Saved' : 'Save Event'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function EventDetail() {
  return <EventDetailContent />;
}
