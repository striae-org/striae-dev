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
        ariaLabel="Numbering tool"
      />
      <Button
        iconId="class"
        isActive={activeTools.has('class')}
        onClick={() => handleToolClick('class')}
        ariaLabel="Classification tool"
      />
      <Button
        iconId="index"
        isActive={activeTools.has('index')}
        onClick={() => handleToolClick('index')}
        ariaLabel="Index tool"
      />
      <Button
        iconId="id"
        isActive={activeTools.has('id')}
        onClick={() => handleToolClick('id')}
        ariaLabel="ID tool"
      />
      <Button
        iconId="notes"
        isActive={activeTools.has('notes')}
        onClick={() => handleToolClick('notes')}
        ariaLabel="Notes tool"
      />
      <Button
        iconId="print"
        isActive={false}
        onClick={() => handleToolClick('print')}
        ariaLabel="Print tool"
      />
        </div>
      </div>
    </div>
  );
};