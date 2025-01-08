import styles from './notice.module.css';

interface NoticeContent {
  title: string;
  content: React.ReactNode;
  buttonText?: string;
}

interface NoticeProps {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeContent;
}

export function Notice({ isOpen, onClose, notice }: NoticeProps) {
  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
      tabIndex={-1}
    >
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-title"
      >
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 id="notice-title">{notice.title}</h2>
        <div className={styles.content}>
          {notice.content}
        </div>
        <button className={styles.confirmButton} onClick={onClose}>
          {notice.buttonText || 'I Understand'}
        </button>
      </div>    
    </div>
  );
}