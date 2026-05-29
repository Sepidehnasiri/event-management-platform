import { useState, useEffect, useRef, useCallback } from 'react';
import EventCard from '../EventCard/EventCard';
import { api } from '../../hooks/useApi';
import styles from './EventList.module.css';

const CATEGORIES = ['All', 'Technology', 'Music', 'Sports', 'Arts'];
const DATE_FILTERS = ['All', 'Upcoming', 'This Week', 'This Month'];
const PRICE_FILTERS = ['All', 'Free', 'Under $50', '$50+'];

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  return d >= weekStart && d <= weekEnd;
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sort, setSort] = useState('date-asc');
  const searchRef = useRef(null);

  // Auto-focus search input (useRef demo)
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvents({ category, search });
      setEvents(data);
    } catch (err) {
      setError('Could not load events. Make sure json-server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const filtered = events
    .filter(e => {
      if (dateFilter === 'Upcoming') return new Date(e.date) >= new Date();
      if (dateFilter === 'This Week') return isThisWeek(e.date);
      if (dateFilter === 'This Month') return isThisMonth(e.date);
      return true;
    })
    .filter(e => {
      const min = e.ticketTypes?.reduce((m, t) => Math.min(m, t.price), Infinity) ?? 0;
      if (priceFilter === 'Free') return min === 0;
      if (priceFilter === 'Under $50') return min < 50 && min > 0;
      if (priceFilter === '$50+') return min >= 50;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
      const aPrice = a.ticketTypes?.reduce((m, t) => Math.min(m, t.price), Infinity) ?? 0;
      const bPrice = b.ticketTypes?.reduce((m, t) => Math.min(m, t.price), Infinity) ?? 0;
      if (sort === 'price-asc') return aPrice - bPrice;
      if (sort === 'price-desc') return bPrice - aPrice;
      return 0;
    });

  const resetFilters = () => {
    setSearch(''); setCategory('All'); setDateFilter('All');
    setPriceFilter('All'); setSort('date-asc');
    searchRef.current?.focus();
  };

  const hasFilters = search || category !== 'All' || dateFilter !== 'All' || priceFilter !== 'All';

  return (
    <main className={styles.page}>
      <div className="container">
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Discover Events</h1>
          <p className={styles.heroSub}>Find and book the best events happening near you</p>
        </section>

        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search events"
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Category</span>
            <div className={styles.pills}>
              {CATEGORIES.map(c => (
                <button key={c} className={`${styles.pill} ${category === c ? styles.pillActive : ''}`}
                  onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Date</span>
            <select className={styles.select} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Price</span>
            <select className={styles.select} value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
              {PRICE_FILTERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Sort by</span>
            <select className={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="date-asc">Date (Earliest)</option>
              <option value="date-desc">Date (Latest)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
            </select>
          </div>

          {hasFilters && (
            <button className={styles.resetBtn} onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className={styles.resultCount}>
            {filtered.length === 0 ? 'No events found' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        )}

        {/* States */}
        {loading && (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            <span className={styles.errorIcon}>⚠</span>
            <div>
              <strong>Unable to load events</strong>
              <p>{error}</p>
            </div>
            <button className={styles.retryBtn} onClick={fetchEvents}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>◎</span>
            <h3>No events found</h3>
            <p>Try adjusting your search or filters</p>
            {hasFilters && <button className={styles.resetBtn} onClick={resetFilters}>Clear all filters</button>}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((event, i) => (
              <div key={event.id} style={{ animationDelay: `${i * 0.06}s` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
