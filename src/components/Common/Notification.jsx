import { createPortal } from 'react-dom';
import { useUser } from '../../contexts/UserContext';
import styles from './Notification.module.css';

export default function Notification() {
  const { notification } = useUser();

  if (!notification) return null;

  return createPortal(
    <div
      className={`${styles.notification} ${styles[notification.type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.icon}>
        {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
      </span>
      {notification.message}
    </div>,
    document.getElementById('notification-root')
  );
}
