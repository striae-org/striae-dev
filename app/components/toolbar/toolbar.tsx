import { useState } from 'react';
import { Button } from '../button/button';
import styles from './toolbar.module.css';

type ToolId = 'number' | 'class' | 'index' | 'id' | 'notes' | 'print';

interface ToolbarProps {
  onToolSelect?: (toolId: ToolId) => void;
}

export const Toolbar = ({ onToolSelect }: ToolbarProps) => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const handleToolClick = (toolId: ToolId) => {
    setActiveTool(activeTool === toolId ? null : toolId);
    onToolSelect?.(toolId);
  };

  return (
    <div 
      className={styles.toolbar}
      role="toolbar"
      aria-label="Annotation tools"
    >
      <Button
        iconId="number"
        isActive={activeTool === 'number'}
        onClick={() => handleToolClick('number')}
        ariaLabel="Numbering tool"
      />
      <Button
        iconId="class"
        isActive={activeTool === 'class'}
        onClick={() => handleToolClick('class')}
        ariaLabel="Classification tool"
      />
      <Button
        iconId="index"
        isActive={activeTool === 'index'}
        onClick={() => handleToolClick('index')}
        ariaLabel="Index tool"
      />
      <Button
        iconId="id"
        isActive={activeTool === 'id'}
        onClick={() => handleToolClick('id')}
        ariaLabel="ID tool"
      />
      <Button
        iconId="notes"
        isActive={activeTool === 'notes'}
        onClick={() => handleToolClick('notes')}
        ariaLabel="Notes tool"
      />
      <Button
        iconId="print"
        isActive={activeTool === 'print'}
        onClick={() => handleToolClick('print')}
        ariaLabel="Print tool"
      />
    </div>
  );
};

Toolbar.displayName = 'Toolbar';