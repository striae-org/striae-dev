import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getNotes } from '~/components/actions/notes-manage';
import styles from './annotations.module.css';

interface AnnotationsProps {
  activeAnnotations: Set<string>;
  currentCase: string;
  imageId?: string;
  user: User;
}

interface NotesData {
  leftCase: string;
  rightCase: string;
  leftItem: string;
  rightItem: string;
  caseFontColor: string;
  classType: 'Bullet' | 'Cartridge Case' | 'Other';
  customClass?: string;
  classNote: string;
  hasSubclass?: boolean;
  indexType: 'number' | 'color';
  indexNumber?: string;
  indexColor?: string;
  supportLevel: 'ID' | 'Exclusion' | 'Inconclusive';
  includeConfirmation: boolean;
  additionalNotes: string;
  updatedAt: string;
}

export const Annotations = ({ activeAnnotations, currentCase, imageId, user }: AnnotationsProps) => {
  const [notesData, setNotesData] = useState<NotesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load notes data when image changes
  useEffect(() => {
    const loadNotes = async () => {
      if (!imageId || !currentCase) {
        setNotesData(null);
        return;
      }

      setIsLoading(true);
      try {
        const notes = await getNotes(user, currentCase, imageId);
        setNotesData(notes);
      } catch (error) {
        console.error('Failed to load notes for annotations:', error);
        setNotesData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [imageId, currentCase, user]);

  // Don't render anything if no annotations are active
  if (activeAnnotations.size === 0) {
    return null;
  }

  return (
    <div className={styles.annotationsContainer}>
      {isLoading ? (
        <div className={styles.loading}>Loading annotations...</div>
      ) : (
        <>
          {/* Case Numbers Annotation */}
          {activeAnnotations.has('number') && (
            <div className={styles.annotationSection}>
              <h4 className={styles.annotationTitle}>Case & Item Numbers</h4>
              <div className={styles.caseNumbersDisplay}>
                {notesData && (
                  <>
                    <div className={styles.caseNumberPair}>
                      <div className={styles.caseNumberItem}>
                        <strong>Left Side:</strong>
                        <div className={styles.caseInfo}>
                          <span className={styles.caseNumber} style={{ color: notesData.caseFontColor }}>
                            {notesData.leftCase || 'No case number'}
                          </span>
                          {notesData.leftItem && (
                            <span className={styles.itemNumber}>
                              Item: {notesData.leftItem}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.caseNumberItem}>
                        <strong>Right Side:</strong>
                        <div className={styles.caseInfo}>
                          <span className={styles.caseNumber} style={{ color: notesData.caseFontColor }}>
                            {notesData.rightCase || 'No case number'}
                          </span>
                          {notesData.rightItem && (
                            <span className={styles.itemNumber}>
                              Item: {notesData.rightItem}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!notesData && (
                  <div className={styles.noData}>
                    No case information available. Add notes to this image to display case numbers.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for other annotation types */}
          {activeAnnotations.has('class') && (
            <div className={styles.annotationSection}>
              <h4 className={styles.annotationTitle}>Class Characteristics</h4>
              <div className={styles.placeholder}>
                Class characteristics display will be implemented here.
              </div>
            </div>
          )}

          {activeAnnotations.has('index') && (
            <div className={styles.annotationSection}>
              <h4 className={styles.annotationTitle}>Index Marks</h4>
              <div className={styles.placeholder}>
                Index marks display will be implemented here.
              </div>
            </div>
          )}

          {activeAnnotations.has('id') && (
            <div className={styles.annotationSection}>
              <h4 className={styles.annotationTitle}>Support Level</h4>
              <div className={styles.placeholder}>
                Support level display will be implemented here.
              </div>
            </div>
          )}

          {activeAnnotations.has('notes') && (
            <div className={styles.annotationSection}>
              <h4 className={styles.annotationTitle}>Additional Notes</h4>
              <div className={styles.placeholder}>
                Additional notes display will be implemented here.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};