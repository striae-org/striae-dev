import { useState } from 'react';
import { Button } from '../button/button';
import styles from './toolbar.module.css';

type ToolId = 'number' | 'class' | 'index' | 'id' | 'notes' | 'print' | 'visibility';

interface ToolbarProps {
  onToolSelect?: (toolId: ToolId, active: boolean) => void;
  onVisibilityChange?: (visible: boolean) => void;
}

export const Toolbar = ({ onToolSelect, onVisibilityChange }: ToolbarProps) => {
  const [activeTools, setActiveTools] = useState<Set<ToolId>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  const handleToolClick = (toolId: ToolId) => {
    if (toolId === 'print') {
      onToolSelect?.('print', true);
      return;
    }

    if (toolId === 'visibility') {
      setIsVisible(!isVisible);
      onVisibilityChange?.(!isVisible);
      return;
    }

    setActiveTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      onToolSelect?.(toolId, next.has(toolId));
      return next;
    });
  };

  return (
    <div className={styles.toolbarContainer}>
      <div className={`${styles.toolbar} ${!isVisible ? styles.hidden : ''}`}>
        <div className={styles.toggleButton}>
          <Button
            iconId={isVisible ? 'eye-off' : 'eye'}
            isActive={false}
            onClick={() => handleToolClick('visibility')}
            ariaLabel={isVisible ? "Hide toolbar" : "Show toolbar"}            
          />
        </div>
      <div className={styles.toolbarContent} role="toolbar" aria-label="Annotation tools">         
      <Button
        iconId="number"
        isActive={activeTools.has('number')}
        onClick={() => handleToolClick('number')}
        ariaLabel="Case & Item Numbers"
      />
      <Button
        iconId="class"
        isActive={activeTools.has('class')}
        onClick={() => handleToolClick('class')}
        ariaLabel="Class Characteristics"
      />
      <Button
        iconId="index"
        isActive={activeTools.has('index')}
        onClick={() => handleToolClick('index')}
        ariaLabel="Index Marks"
      />
      <Button
        iconId="id"
        isActive={activeTools.has('id')}
        onClick={() => handleToolClick('id')}
        ariaLabel="Support Level"
      />
      <Button
        iconId="notes"
        isActive={activeTools.has('notes')}
        onClick={() => handleToolClick('notes')}
        ariaLabel="Additional Notes"
      />
      <Button
        iconId="print"
        isActive={false}
        onClick={() => handleToolClick('print')}
        ariaLabel="Save/Print to PDF"
      />
        </div>
      </div>
    </div>
  );
};