import { useState, useEffect } from 'react';
import styles from './notes.module.css';

interface NotesSidebarProps {
  currentCase: string;
  onReturn: () => void;
}

type SupportLevel = 'ID' | 'Exclusion' | 'Inconclusive';
type ClassType = 'Bullet' | 'Cartridge Case' | 'Other';
type IndexType = 'number' | 'color';

export const NotesSidebar = ({ currentCase, onReturn }: NotesSidebarProps) => {
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
  const [supportLevel, setSupportLevel] = useState<SupportLevel>('Inconclusive');
  const [includeConfirmation, setIncludeConfirmation] = useState(false);

 useEffect(() => {
    if (useCurrentCaseLeft) {
      setLeftCase(currentCase);
    }
    if (useCurrentCaseRight) {
      setRightCase(currentCase);
    }
  }, [useCurrentCaseLeft, useCurrentCaseRight, currentCase]);

  return (
    <div className={styles.notesSidebar}>
      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>Case Information</h5>
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
            <div className={styles.caseInput}>
              <label htmlFor="leftItem">Left Side Item #</label>
              <input
                id="leftItem"
                type="text"
                value={leftItem}
                onChange={(e) => setLeftItem(e.target.value)}                
              />
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={useCurrentCaseLeft}
                onChange={(e) => setUseCurrentCaseLeft(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Use current case number for left side</span>
            </label>
          </div>

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
            <div className={styles.caseInput}>
              <label htmlFor="rightItem">Right Side Item #</label>
              <input
                id="rightItem"
                type="text"
                value={rightItem}
                onChange={(e) => setRightItem(e.target.value)}                
              />
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={useCurrentCaseRight}
                onChange={(e) => setUseCurrentCaseRight(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Use current case number for right side</span>
            </label>
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
              placeholder="Specify class characteristic"              
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
            <label className={styles.colorLabel}>
              <span>Select index color</span>
              <input
                type="color"
                value={indexColor}
                onChange={(e) => setIndexColor(e.target.value)}
                className={styles.colorInput}
                title="Color picker for index"
                aria-label="Select index color"
              />
            </label>
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
        </div>
      </div>

      <div className={`${styles.section} ${styles.confirmation}`}>
        <label className={styles.checkboxLabel}>
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
        onClick={onReturn}
        className={styles.returnButton}
      >
        Return to Case Management
      </button>
    </div>
  );
};