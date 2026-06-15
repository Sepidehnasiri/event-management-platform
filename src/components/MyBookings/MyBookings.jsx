import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings, useAllBookingsRaw, useCancelBooking } from '../../hooks/useBookings';
import { useUser } from '../../contexts/UserContext';
import Modal from '../Common/Modal';
import styles from './MyBookings.module.css';

const FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'upcoming',  label: 'Upcoming' },
  { value: 'past',      label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const { showNotification } = useUser();
  const [filter, setFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data: filtered = [], isLoading, error, refetch } = useBookings(filter);
  const { data: allBookings = [] } = useAllBookingsRaw();
  const cancelMutation = useCancelBooking();

  const now = new Date();
  const isUpcoming = (b) => new Date(b.eventDate) > now && b.status !== 'cancelled';

  const tabCount = (val) => {
    if (val === 'all') return allBookings.length;
    if (val === 'upcoming') return allBookings.filter(b => isUpcoming(b)).length;
    if (val === 'past') return allBookings.filter(b => new Date(b.eventDate) <= now && b.status !== 'cancelled').length;
    if (val === 'cancelled') return allBookings.filter(b => b.status === 'cancelled').length;
    return 0;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null); // close modal immediately for snappy UX

    try {
      await cancelMutation.mutateAsync(target.id);
      showNotification('Booking cancelled successfully.');
    } catch {
      showNotification('Failed to cancel booking. Please try again.', 'error');
    }
  };

  const statusBadge = (b) => {
    if (b.status === 'cancelled') return { label: 'Cancelled', cls: styles.badgeCancelled };
    if (isUpcoming(b))            return { label: 'Confirmed', cls: styles.badgeConfirmed };
    return                               { label: 'Past',      cls: styles.badgePast };
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
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.tab} ${filter === value ? styles.tabActive : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
              <span className={styles.count}>{tabCount(value)}</span>
            </button>
          ))}
        </div>

        {isLoading && (
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
              <p>Make sure JSON Server is running on port 3001</p>
            </div>
            <button onClick={() => refetch()} className={styles.retryBtn}>Retry</button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🎟</span>
            <h3>No bookings found</h3>
            <p>
              {filter === 'upcoming'  ? 'You have no upcoming bookings.' :
               filter === 'past'      ? 'No past bookings.' :
               filter === 'cancelled' ? 'No cancelled bookings.' :
               "You haven't booked any events yet."}
            </p>
            <button className={styles.browseBtnLarge} onClick={() => navigate('/events')}>
              Discover Events
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map(booking => {
              const badge    = statusBadge(booking);
              const canCancel = isUpcoming(booking);
              const formattedDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={booking.id}
                  className={`${styles.bookingCard} ${!canCancel ? styles.dimmed : ''}`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.eventInfo}>
                      <h3
                        className={styles.eventTitle}
                        onClick={() => navigate(`/events/${booking.eventId}`)}
                      >
                        {booking.eventTitle}
                      </h3>
                      <div className={styles.eventMeta}>
                        <span>📅 {formattedDate}</span>
                        <span>🎟 {booking.tickets?.reduce((s, t) => s + t.quantity, 0)} ticket(s)</span>
                        <span>💳 ${booking.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                      {canCancel && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => setCancelTarget(booking)}
                          disabled={cancelMutation.isPending}
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

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Booking"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Are you sure you want to cancel your booking for{' '}
          <strong>{cancelTarget?.eventTitle}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ padding: '10px 20px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}
            onClick={() => setCancelTarget(null)}
          >
            Keep Booking
          </button>
          <button
            style={{ padding: '10px 20px', background: '#e85d26', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            onClick={handleCancel}
          >
            Yes, Cancel
          </button>
        </div>
      </Modal>
    </main>
  );
}
