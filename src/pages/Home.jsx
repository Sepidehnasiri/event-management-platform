import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <div className={`${styles.hero} container`}>
        <div className={styles.heroContent}>
          <span className={styles.pill}>✦ Your Event Platform</span>
          <h1 className={styles.headline}>
            Discover &amp; Book<br />
            <em>Unforgettable</em> Events
          </h1>
          <p className={styles.sub}>
            From tech conferences to live music, sports events to art showcases —
            find and book tickets for the experiences that matter to you.
          </p>
          <div className={styles.ctas}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/events')}>
              Browse Events →
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/my-bookings')}>
              My Bookings
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard} style={{ '--delay': '0s' }}>
            <span>🎸</span>
            <div>
              <strong>Jazz & Blues Festival</strong>
              <span>New Orleans · Jun 20</span>
            </div>
          </div>
          <div className={styles.floatingCard} style={{ '--delay': '0.2s' }}>
            <span>💻</span>
            <div>
              <strong>React Conference</strong>
              <span>San Francisco · Jul 15</span>
            </div>
          </div>
          <div className={styles.floatingCard} style={{ '--delay': '0.4s' }}>
            <span>🎨</span>
            <div>
              <strong>Modern Art Showcase</strong>
              <span>New York · Sep 10</span>
            </div>
          </div>
        </div>
      </div>

      <section className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            {[
              { icon: '🔍', title: 'Discover', desc: 'Search and filter events by category, date, and price.' },
              { icon: '🎟', title: 'Book Instantly', desc: 'Secure your tickets in seconds with our simple booking flow.' },
              { icon: '📋', title: 'Manage Bookings', desc: 'View, track, and cancel your upcoming events anytime.' },
            ].map(f => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
