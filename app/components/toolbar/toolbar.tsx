import { useState } from 'react';
import { ToolbarButton } from '../button/button';
import styles from './toolbar.module.css';

type Tool = 'print' | 'number' | 'index' | 'id' | 'class' | 'notes';

interface ToolbarProps {
  onToolSelect?: (tool: Tool) => void;
}

export const Toolbar = ({ onToolSelect }: ToolbarProps) => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(activeTool === tool ? null : tool);
    onToolSelect?.(tool);
  };

  return (
    <div 
      className={styles.toolbar}
      role="toolbar"
      aria-label="Image annotation tools"
    >
        <ToolbarButton
        type="number"
        isActive={activeTool === 'number'}
        onClick={() => handleToolClick('number')}
        ariaLabel="Case/Item Numbers"
      />
        <ToolbarButton
        type="index"
        isActive={activeTool === 'index'}
        onClick={() => handleToolClick('index')}
        ariaLabel="Index Color/Number"
      />
      <ToolbarButton
        type="class"
        isActive={activeTool === 'class'}
        onClick={() => handleToolClick('class')}
        ariaLabel="Class Characteristics"
      />
      <ToolbarButton
        type="id"
        isActive={activeTool === 'id'}
        onClick={() => handleToolClick('id')}
        ariaLabel="ID/Exclusion/Inc"
      />
      <ToolbarButton
        type="annotate"
        isActive={activeTool === 'notes'}
        onClick={() => handleToolClick('notes')}
        ariaLabel="Other Notes"
      />
      <ToolbarButton
        type="print"
        isActive={activeTool === 'print'}
        onClick={() => handleToolClick('print')}
        ariaLabel="Save/Print to PDF"
      />
    </div>
  );
};