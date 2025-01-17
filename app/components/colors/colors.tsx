import { useState } from 'react';
import styles from './colors.module.css';

interface ColorSelectorProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const commonColors = [
  '#ff0000', // red
  '#ff8000', // orange
  '#ffff00', // yellow
  '#00ff00', // green
  '#00ffff', // cyan
  '#0000ff', // blue
  '#8000ff', // purple
  '#ff00ff', // magenta
  '#000000', // black
  '#808080', // gray
];

export const ColorSelector = ({ selectedColor, onColorSelect }: ColorSelectorProps) => {
  const [showColorWheel, setShowColorWheel] = useState(false);

  return (
    <div className={styles.colorSelector}>
      <div className={styles.colorHeader}>
        <span className={styles.colorLabel}>Select index color</span>
        <button 
          onClick={() => setShowColorWheel(!showColorWheel)}
          className={styles.toggleButton}
        >
          {showColorWheel ? 'Show Presets' : 'Show Color Wheel'}
        </button>
      </div>
      
      {showColorWheel ? (
        <>
          <label htmlFor="colorWheelInput">Color:</label>
          <input
            id="colorWheelInput"
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
              key={color}
              className={`${styles.colorSwatch} ${color === selectedColor ? styles.selected : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect(color)}
              aria-label={`Select ${color} color`}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
};