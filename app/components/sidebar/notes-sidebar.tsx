import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ColorSelector } from '~/components/colors/colors';
import { NotesModal } from './notes-modal';
import { saveNotes } from '~/components/actions/notes-manage';
import styles from './notes.module.css';

interface NotesSidebarProps {
  currentCase: string;
  onReturn: () => void;
  user: User;
  imageId: string;
}

interface NotesData {
  leftCase: string;
  rightCase: string;
  leftItem: string;
  rightItem: string;
  classType: ClassType;
  customClass?: string;
  classNote: string;
  indexType: IndexType;
  indexNumber?: string;
  indexColor?: string;
  supportLevel: SupportLevel;
  includeConfirmation: boolean;
  additionalNotes: string;
  updatedAt: string;
}

type SupportLevel = 'ID' | 'Exclusion' | 'Inconclusive';
type ClassType = 'Bullet' | 'Cartridge Case' | 'Other';
type IndexType = 'number' | 'color';

export const NotesSidebar = ({ currentCase, onReturn, user, imageId }: NotesSidebarProps) => {
  // Case numbers state
  const [leftCase, setLeftCase] = useState('');
  const [rightCase, setRightCase] = useState('');
  const [leftItem, setLeftItem] = useState('');
  const [rightItem, setRightItem] = useState('');
  const [useCurrentCaseLeft, setUseCurrentCaseLeft] = useState(false);
  const [useCurrentCaseRight, setUseCurrentCaseRight] = useState(false);

  // Class characteristics state
  const [classType, setClassType] = useState<ClassType>('Bullet');
  const [customClass, setCustomClass] = useState('');
  const [classNote, setClassNote] = useState('');

  // Index state
  const [indexType, setIndexType] = useState<IndexType>('number');
  const [indexNumber, setIndexNumber] = useState('');
  const [indexColor, setIndexColor] = useState('#000000');

  // Support level and confirmation
  const [supportLevel, setSupportLevel] = useState<SupportLevel>('ID');
  const [includeConfirmation, setIncludeConfirmation] = useState(false);

  // Additional Notes Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

 useEffect(() => {
    if (useCurrentCaseLeft) {
      setLeftCase(currentCase);
    }
    if (useCurrentCaseRight) {
      setRightCase(currentCase);
    }
  }, [useCurrentCaseLeft, useCurrentCaseRight, currentCase]);

  const handleSave = async () => {

    if (!imageId) {
      console.error('No image selected');
      return;
    }

    try {
      const notesData: NotesData = {
        leftCase,
        rightCase,
        leftItem,
        rightItem,
        classType,
        customClass: classType === 'Other' ? customClass : undefined,
        classNote,
        indexType,
        indexNumber: indexType === 'number' ? indexNumber : undefined,
        indexColor: indexType === 'color' ? indexColor : undefined,
        supportLevel,
        includeConfirmation,
        additionalNotes,
        updatedAt: new Date().toISOString()
      };

      await saveNotes(user, currentCase, imageId, notesData);
      // Add success message or handler
    } catch (error) {
      // Add error handling
      console.error('Failed to save notes:', error);
    }
  };

  return (
    <div className={styles.notesSidebar}>
      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>Case Information</h5>
        <hr />
        <div className={styles.caseNumbers}>
          {/* Left side inputs */}
          <div className={styles.inputGroup}>
            <div className={styles.caseInput}>
              <label htmlFor="leftCase">Left Side Case #</label>
              <input
                id="leftCase"
                type="text"
                value={leftCase}
                onChange={(e) => setLeftCase(e.target.value)}
                disabled={useCurrentCaseLeft}                
              />
            </div>
            <label className={`${styles.checkboxLabel} mb-4`}>
              <input
                type="checkbox"
                checked={useCurrentCaseLeft}
                onChange={(e) => setUseCurrentCaseLeft(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Use current case number</span>
            </label>            
            <div className={styles.caseInput}>
              <label htmlFor="leftItem">Left Side Item #</label>
              <input
                id="leftItem"
                type="text"
                value={leftItem}
                onChange={(e) => setLeftItem(e.target.value)}                
              />
            </div>            
          </div>
          <hr />
          {/* Right side inputs */}
          <div className={styles.inputGroup}>
            <div className={styles.caseInput}>
              <label htmlFor="rightCase">Right Side Case #</label>
              <input
                id="rightCase"
                type="text"
                value={rightCase}
                onChange={(e) => setRightCase(e.target.value)}
                disabled={useCurrentCaseRight}                
              />
            </div>
            <label className={`${styles.checkboxLabel} mb-4`}>
              <input
                type="checkbox"
                checked={useCurrentCaseRight}
                onChange={(e) => setUseCurrentCaseRight(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Use current case number</span>
            </label>
            <div className={styles.caseInput}>
              <label htmlFor="rightItem">Right Side Item #</label>
              <input
                id="rightItem"
                type="text"
                value={rightItem}
                onChange={(e) => setRightItem(e.target.value)}                
              />
            </div>            
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>Class Characteristics</h5>
        <div className={styles.classCharacteristics}>
          <select
            id="classType"
            aria-label="Class Type"
            value={classType}
            onChange={(e) => setClassType(e.target.value as ClassType)}
            className={styles.select}
          >
            <option value="Bullet">Bullet</option>
            <option value="Cartridge Case">Cartridge Case</option>
            <option value="Other">Other</option>
          </select>

          {classType === 'Other' && (
            <input
              type="text"
              value={customClass}
              onChange={(e) => setCustomClass(e.target.value)}
              placeholder="Specify object type"              
            />
          )}

          <textarea
            value={classNote}
            onChange={(e) => setClassNote(e.target.value)}
            placeholder="Enter class characteristic details..."
            className={styles.textarea}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>Index Type</h5>
        <div className={styles.indexing}>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={indexType === 'number'}
                onChange={() => setIndexType('number')}
              />
              <span>Number</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={indexType === 'color'}
                onChange={() => setIndexType('color')}
              />
              <span>Color</span>
            </label>
          </div>

          {indexType === 'number' ? (
            <input
              type="text"
              value={indexNumber}
              onChange={(e) => setIndexNumber(e.target.value)}
              placeholder="Enter index number"              
            />
          ) : (
            <ColorSelector
              selectedColor={indexColor}
              onColorSelect={setIndexColor}
            />
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>Support Level</h5>
        <div className={styles.support}>
          <select
            id="supportLevel"
            aria-label="Support Level"
            value={supportLevel}
            onChange={(e) => setSupportLevel(e.target.value as SupportLevel)}
            className={styles.select}
          >
            <option value="ID">Identification</option>
            <option value="Exclusion">Exclusion</option>
            <option value="Inconclusive">Inconclusive</option>
          </select>
          <label className={`${styles.checkboxLabel} mb-4`}>
          <input
            type="checkbox"
            checked={includeConfirmation}
            onChange={(e) => setIncludeConfirmation(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Include Confirmation Field</span>
        </label>
        </div>
        <button 
        onClick={() => setIsModalOpen(true)}
        className={styles.notesButton}
      >
        Additional Notes
      </button>
      </div> 
      <div className={styles.buttonGroup}>     
        <button 
          onClick={handleSave}
          className={styles.saveButton}
        >
          Save Notes
        </button>
        <button 
          onClick={onReturn}
          className={styles.returnButton}
        >
          Return to Case Management
        </button>      
      </div>
      <NotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notes={additionalNotes}
        onSave={setAdditionalNotes}
      />

    </div>
  );
};