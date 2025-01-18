import { useState, useEffect } from 'react';
import styles from './notes.module.css';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  onSave: (notes: string) => void;
}

export const NotesModal = ({ isOpen, onClose, notes, onSave }: NotesModalProps) => {
  const [tempNotes, setTempNotes] = useState(notes);

  useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
  
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, onClose]);

  if (!isOpen) return null;  

  const handleSave = () => {
    onSave(tempNotes);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h5 className={styles.modalTitle}>Additional Notes</h5>
        <textarea
          value={tempNotes}
          onChange={(e) => setTempNotes(e.target.value)}
          className={styles.modalTextarea}
          placeholder="Enter additional notes..."
        />
        <div className={styles.modalButtons}>
          <button onClick={handleSave} className={styles.saveButton}>Save</button>
          <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
        </div>
      </div>
    </div>
  );
};