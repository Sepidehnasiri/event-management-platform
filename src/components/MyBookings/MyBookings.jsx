import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../hooks/useApi';
import { useUser } from '../../contexts/UserContext';
import Modal from '../Common/Modal';
import styles from './MyBookings.module.css';

export default function MyBookings() {
  const navigate = useNavigate();
  const { showNotification } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBookings('user1');
      setBookings(data);
    } catch {
      setError('Could not load bookings. Make sure json-server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const now = new Date();

  const filtered = bookings.filter(b => {
    const eventDate = new Date(b.eventDate);
    if (filter === 'upcoming') return eventDate >= now && b.status !== 'cancelled';
    if (filter === 'past') return eventDate < now || b.status === 'cancelled';
    return true;
  });

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.cancelBooking(cancelTarget.id);
      setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b));
      showNotification('Booking cancelled successfully.');
    } catch {
      showNotification('Failed to cancel booking. Please try again.', 'error');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const isUpcoming = (b) => new Date(b.eventDate) >= now && b.status !== 'cancelled';

  const statusBadge = (b) => {
    if (b.status === 'cancelled') return { label: 'Cancelled', cls: styles.badgeCancelled };
    if (isUpcoming(b)) return { label: 'Confirmed', cls: styles.badgeConfirmed };
    return { label: 'Past', cls: styles.badgePast };
  };

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>My Bookings</h1>
          <button className={styles.browseBtn} onClick={() => navigate('/events')}>
            Browse Events
          </button>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          {[['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past & Cancelled']].map(([val, label]) => (
            <button
              key={val}
              className={`${styles.tab} ${filter === val ? styles.tabActive : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
              {val !== 'all' && (
                <span className={styles.count}>
                  {bookings.filter(b => val === 'upcoming' ? isUpcoming(b) : !isUpcoming(b)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className={styles.skeletonList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            <span>⚠</span>
            <div>
              <strong>Unable to load bookings</strong>
              <p>{error}</p>
            </div>
            <button onClick={fetchBookings} className={styles.retryBtn}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🎟</span>
            <h3>No bookings yet</h3>
            <p>{filter === 'upcoming' ? 'You have no upcoming bookings.' : filter === 'past' ? 'No past or cancelled bookings.' : "You haven't booked any events yet."}</p>
            <button className={styles.browseBtnLarge} onClick={() => navigate('/events')}>
              Discover Events
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map(booking => {
              const badge = statusBadge(booking);
              const canCancel = isUpcoming(booking);
              const formattedDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              });
              return (
                <div key={booking.id} className={`${styles.bookingCard} ${!canCancel ? styles.dimmed : ''}`}>
                  <div className={styles.cardTop}>
                    <div className={styles.eventInfo}>
                      <h3 className={styles.eventTitle}
                        onClick={() => navigate(`/events/${booking.eventId}`)}
                      >
                        {booking.eventTitle}
                      </h3>
                      <div className={styles.eventMeta}>
                        <span>📅 {formattedDate}</span>
                        <span>🎟 {booking.tickets?.reduce((s, t) => s + t.quantity, 0)} ticket{booking.tickets?.reduce((s, t) => s + t.quantity, 0) !== 1 ? 's' : ''}</span>
                        <span>💳 ${booking.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                      {canCancel && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => setCancelTarget(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardBottom}>
                    <div className={styles.refBox}>
                      <span className={styles.refLabel}>Ref</span>
                      <span className={styles.refNum}>{booking.referenceNumber}</span>
                    </div>
                    <div className={styles.ticketBreakdown}>
                      {booking.tickets?.map((t, i) => (
                        <span key={i} className={styles.ticketTag}>
                          {t.type} × {t.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal (Portal) */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Booking"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Are you sure you want to cancel your booking for <strong>{cancelTarget?.eventTitle}</strong>?
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ padding: '10px 20px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}
            onClick={() => setCancelTarget(null)}
          >
            Keep Booking
          </button>
          <button
            style={{ padding: '10px 20px', background: '#e85d26', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: 700, opacity: cancelling ? 0.6 : 1 }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </Modal>
    </main>
  );
}
