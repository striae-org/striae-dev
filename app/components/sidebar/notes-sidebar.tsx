import { useState, useEffect } from 'react';
import styles from './sidebar.module.css';

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
      <h4>Comparison Notes</h4>
      
      <div className={styles.caseNumbers}>
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

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={useCurrentCaseLeft}
            onChange={(e) => setUseCurrentCaseLeft(e.target.checked)}
          />
          Use current case number for left side
        </label>
        
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

         <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={useCurrentCaseRight}
            onChange={(e) => setUseCurrentCaseRight(e.target.checked)}
          />
          Use current case number for right side
        </label>
      </div>

      <div className={styles.classCharacteristics}>
        <label htmlFor="classType">Class Characteristics</label>
        <select
          id="classType"
          value={classType}
          onChange={(e) => setClassType(e.target.value as ClassType)}
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
        />
      </div>

      <div className={styles.indexing}>
        <label htmlFor="indexTypeGroup">Index Type</label>
        <div id="indexTypeGroup" className={styles.radioGroup} role="radiogroup">
          <label id="number-label">
            <input
              type="radio"
              checked={indexType === 'number'}
              onChange={() => setIndexType('number')}
              title="Number index type"
              aria-labelledby="number-label"
            />
            Number
          </label>
          <label id="color-label">
            <input
              type="radio"
              checked={indexType === 'color'}
              onChange={() => setIndexType('color')}
              title="Color index type"
              aria-labelledby="color-label"
            />
            Color
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
          <input
            type="color"
            value={indexColor}
            onChange={(e) => setIndexColor(e.target.value)}
            title="Choose index color"
          />
        )}
      </div>

      <div className={styles.support}>
        <label htmlFor="supportLevel">Support For</label>
        <select
          id="supportLevel"
          value={supportLevel}
          onChange={(e) => setSupportLevel(e.target.value as SupportLevel)}
        >
          <option value="ID">Identification</option>
          <option value="Exclusion">Exclusion</option>
          <option value="Inconclusive">Inconclusive</option>
        </select>
      </div>

      <div className={styles.confirmation}>
        <label>
          <input
            type="checkbox"
            checked={includeConfirmation}
            onChange={(e) => setIncludeConfirmation(e.target.checked)}
          />
          Include Confirmation Field
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