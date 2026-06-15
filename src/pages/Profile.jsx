import { useState, useId } from 'react';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { usersAPI, eventsAPI } from '../services/api';
import styles from './Profile.module.css';

const CURRENT_USER_ID = 'user1';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { favorites } = useUser();

  // Access prefetched user from root loader via useRouteLoaderData
  const rootData = useRouteLoaderData('root');

  const formId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User query — uses root loader data as initial cache value
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', CURRENT_USER_ID],
    queryFn: () => usersAPI.getById(CURRENT_USER_ID).then(r => r.data),
    initialData: rootData?.user ?? undefined,
  });

  // Fetch all events, filter to favourites client-side via select
  const { data: favoriteEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', {}],
    queryFn: () => eventsAPI.getAll({}).then(r => r.data),
    select: (data) => {
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      return arr.filter(e => favorites.includes(e.id));
    },
    enabled: favorites.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => usersAPI.update(CURRENT_USER_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', CURRENT_USER_ID] });
    },
  });

  const handleEditStart = () => {
    setEditName(user?.name || '');
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await updateMutation.mutateAsync({ name: trimmed });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error shown inline
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName('');
  };

  if (userLoading) {
    return (
      <main className={styles.page}>
        <div className="container">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonCard} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>My Profile</h1>

        {/* ── User Info Card ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Account Information</h2>
            {!isEditing && (
              <button className={styles.editBtn} onClick={handleEditStart}>
                Edit
              </button>
            )}
          </div>

          <div className={styles.avatar}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>

          {saveSuccess && (
            <div className={styles.successBanner}>Profile updated successfully.</div>
          )}

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.field}>
                <label htmlFor={`${formId}-name`} className={styles.label}>Display Name</label>
                <input
                  id={`${formId}-name`}
                  className={styles.input}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </div>
              <div className={styles.editActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !editName.trim()}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
                <button className={styles.btnSecondary} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
              {updateMutation.isError && (
                <p className={styles.errorText}>Failed to update profile. Try again.</p>
              )}
            </div>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>{user?.name || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user?.email || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>User ID</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {user?.id || '—'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ── Theme Preferences ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Preferences</h2>
          </div>
          <div className={styles.preferenceRow}>
            <div>
              <div className={styles.preferenceLabel}>Theme</div>
              <div className={styles.preferenceDesc}>
                Currently using <strong>{theme}</strong> mode
              </div>
            </div>
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </section>

        {/* ── Favourite Events ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              Saved Events
              <span className={styles.badge}>{favorites.length}</span>
            </h2>
            <button className={styles.editBtn} onClick={() => navigate('/events')}>
              Browse All
            </button>
          </div>

          {favorites.length === 0 ? (
            <div className={styles.emptyFavs}>
              <span className={styles.emptyIcon}>♡</span>
              <p>No saved events yet.</p>
              <button className={styles.btnPrimary} onClick={() => navigate('/events')}>
                Discover Events
              </button>
            </div>
          ) : eventsLoading ? (
            <div className={styles.favSkeletonGrid}>
              {favorites.map((_, i) => (
                <div key={i} className={styles.favSkeleton} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ) : (
            <div className={styles.favGrid}>
              {favoriteEvents.length > 0 ? favoriteEvents.map(event => (
                <button
                  key={event.id}
                  className={styles.favCard}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <img src={event.image} alt={event.title} className={styles.favImg} loading="lazy" />
                  <div className={styles.favInfo}>
                    <div className={styles.favTitle}>{event.title}</div>
                    <div className={styles.favMeta}>
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{event.location}
                    </div>
                  </div>
                </button>
              )) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your saved events will appear here. Start browsing to add some!
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Quick Links ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quick Links</h2>
          </div>
          <div className={styles.quickLinks}>
            <button className={styles.quickLink} onClick={() => navigate('/my-bookings')}>
              <span className={styles.quickLinkIcon}>🎟</span>
              My Bookings
            </button>
            <button className={styles.quickLink} onClick={() => navigate('/create-event')}>
              <span className={styles.quickLinkIcon}>+</span>
              Create Event
            </button>
            <button className={styles.quickLink} onClick={() => navigate('/events')}>
              <span className={styles.quickLinkIcon}>◎</span>
              Browse Events
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
