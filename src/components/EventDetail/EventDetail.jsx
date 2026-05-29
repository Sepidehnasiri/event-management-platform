import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../hooks/useApi';
import { useUser } from '../../contexts/UserContext';
import styles from './EventDetail.module.css';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getEvent(id)
      .then(setEvent)
      .catch(() => setError('Event not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
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
          <p>{error}</p>
          <button onClick={() => navigate('/events')} className={styles.backBtn}>← Back to Events</button>
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

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About this event</h2>
              <p className={styles.description}>{event.description}</p>
            </section>

            {/* Ticket types */}
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
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.stickyBox}>
              <button
                className={styles.bookBtn}
                onClick={() => navigate(`/events/${event.id}/book`)}
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
