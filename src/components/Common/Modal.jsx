import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
        {children}
        <button className={styles.close} onClick={onClose} aria-label="Close modal">✕</button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
