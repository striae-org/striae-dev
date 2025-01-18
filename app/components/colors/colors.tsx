import { useState } from 'react';
import styles from './colors.module.css';

interface ColorSelectorProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

interface ColorOption {
  value: string;
  label: string;
}

const commonColors: ColorOption[] = [
  { value: '#ff0000', label: 'Red' },
  { value: '#ff8000', label: 'Orange' },
  { value: '#ffde21', label: 'Yellow' },
  { value: '#00ff00', label: 'Green' },
  { value: '#00ffff', label: 'Cyan' },
  { value: '#0000ff', label: 'Blue' },
  { value: '#8000ff', label: 'Purple' },
  { value: '#ff00ff', label: 'Magenta' },
  { value: '#000000', label: 'Black' },
  { value: '#808080', label: 'Gray' }
];

export const ColorSelector = ({ selectedColor, onColorSelect }: ColorSelectorProps) => {
  const [showColorWheel, setShowColorWheel] = useState(false);

  return (
    <div className={styles.colorSelector}>
      <div className={styles.colorHeader}>
        <span className={styles.colorLabel}>Select color</span>
        <button 
          onClick={() => setShowColorWheel(!showColorWheel)}
          className={styles.toggleButton}
        >
          {showColorWheel ? 'Presets' : 'Color Wheel'}
        </button>
      </div>
      
      {showColorWheel ? (
        <>          
          <input            
            type="color"
            value={selectedColor}
            onChange={(e) => onColorSelect(e.target.value)}
            className={styles.colorWheel}
            title="Choose a color"
          />
        </>
      ) : (
        <div className={styles.colorGrid}>
        {commonColors.map((color) => (
          <button
            key={color.value}
            className={`${styles.colorSwatch} ${color.value === selectedColor ? styles.selected : ''}`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorSelect(color.value)}
            aria-label={`Select ${color.label}`}
            title={color.label}
          />
        ))}
      </div>
      )}
    </div>
  );
};