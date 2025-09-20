import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BoxAnnotation } from '~/types';
import styles from './box-annotations.module.css';

// Constants
const PRESET_COLOR_NAMES: Record<string, string> = {
  '#ff0000': 'Red',
  '#ff8000': 'Orange', 
  '#ffde21': 'Yellow',
  '#00ff00': 'Green',
  '#00ffff': 'Cyan',
  '#0000ff': 'Blue',
  '#8000ff': 'Purple',
  '#ff00ff': 'Magenta',
  '#000000': 'Black',
  '#ffffff': 'White'
} as const;

const MIN_BOX_SIZE_PERCENT = 1; // Minimum box size as percentage of image
const DIALOG_OFFSET = 10; // Offset for dialog positioning

interface BoxAnnotationsProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  annotations: BoxAnnotation[];
  onAnnotationsChange: (annotations: BoxAnnotation[]) => void;
  isAnnotationMode: boolean;
  annotationColor: string;
  className?: string;
  annotationData?: {
    additionalNotes?: string;
  };
  onAnnotationDataChange?: (data: { additionalNotes?: string; boxAnnotations?: BoxAnnotation[] }) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface LabelDialogState {
  isVisible: boolean;
  annotationId: string | null;
  x: number;
  y: number;
  label: string;
}

export const BoxAnnotations = ({
  imageRef,
  annotations,
  onAnnotationsChange,
  isAnnotationMode,
  annotationColor,
  className,
  annotationData,
  onAnnotationDataChange
}: BoxAnnotationsProps) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const [labelDialog, setLabelDialog] = useState<LabelDialogState>({
    isVisible: false,
    annotationId: null,
    x: 0,
    y: 0,
    label: ''
  });

  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized function to get relative coordinates (more stable reference)
  const getRelativeCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const imageElement = imageRef.current;
    if (!imageElement) return { x: 0, y: 0 };
    
    try {
      const rect = imageElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Clamp values to valid range
      return { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y))
      };
    } catch (error) {
      console.warn('Error calculating relative coordinates:', error);
      return { x: 0, y: 0 };
    }
  }, []); // Remove imageRef dependency for stability

  // Helper function to generate unique annotation ID
  const generateAnnotationId = useCallback(() => {
    return `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Helper function to calculate dialog position with viewport boundary checks
  const calculateDialogPosition = useCallback((x: number, y: number): { x: number; y: number } => {
    const imageElement = imageRef.current;
    if (!imageElement) return { x: 0, y: 0 };

    const rect = imageElement.getBoundingClientRect();
    const dialogX = rect.left + (x / 100) * rect.width;
    const dialogY = rect.top + (y / 100) * rect.height;

    // Check viewport boundaries and adjust if necessary
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dialogWidth = 220; // Approximate dialog width
    const dialogHeight = 120; // Approximate dialog height

    const adjustedX = Math.min(dialogX, viewportWidth - dialogWidth - DIALOG_OFFSET);
    const adjustedY = Math.min(dialogY, viewportHeight - dialogHeight - DIALOG_OFFSET);

    return {
      x: Math.max(DIALOG_OFFSET, adjustedX),
      y: Math.max(DIALOG_OFFSET, adjustedY)
    };
  }, []);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drawing if in annotation mode and not clicking on an existing box
    if (!isAnnotationMode || !imageRef.current) return;
    
    // Check if clicking on an existing annotation
    const target = e.target as HTMLElement;
    if (target.classList.contains(styles.savedAnnotationBox)) {
      return; // Don't start drawing if clicking on an existing box
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const { x, y } = getRelativeCoordinates(e);
    
    if (isMountedRef.current) {
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y
      });
    }
  }, [isAnnotationMode, getRelativeCoordinates]);

  // Handle mouse move - update current drawing box
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !isAnnotationMode) return;
    
    e.preventDefault();
    const { x, y } = getRelativeCoordinates(e);
    
    if (isMountedRef.current) {
      setDrawingState(prev => ({
        ...prev,
        currentX: x,
        currentY: y
      }));
    }
  }, [drawingState.isDrawing, isAnnotationMode, getRelativeCoordinates]);

  // Handle mouse up - complete drawing and save annotation
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !isAnnotationMode || !isMountedRef.current) return;
    
    const { startX, startY, currentX, currentY } = drawingState;
    
    // Calculate box dimensions
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    // Reset drawing state first
    setDrawingState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    });

    // Only save if box has meaningful size (at least MIN_BOX_SIZE_PERCENT of image)
    if (width > MIN_BOX_SIZE_PERCENT && height > MIN_BOX_SIZE_PERCENT) {
      const newAnnotation: BoxAnnotation = {
        id: generateAnnotationId(),
        x,
        y,
        width,
        height,
        color: annotationColor,
        timestamp: new Date().toISOString()
      };
      
      // Save the annotation immediately
      const updatedAnnotations = [...annotations, newAnnotation];
      onAnnotationsChange(updatedAnnotations);
      
      // Show label dialog positioned near the annotation with boundary checks
      const dialogPosition = calculateDialogPosition(x, y);
      setLabelDialog({
        isVisible: true,
        annotationId: newAnnotation.id,
        x: dialogPosition.x,
        y: dialogPosition.y,
        label: ''
      });
    }
  }, [
    drawingState, 
    isAnnotationMode, 
    annotationColor, 
    annotations, 
    onAnnotationsChange, 
    generateAnnotationId,
    calculateDialogPosition
  ]);

  // Remove a box annotation with validation
  const removeBoxAnnotation = useCallback((annotationId: string) => {
    // Find the annotation being removed
    const annotationToRemove = annotations.find(annotation => annotation.id === annotationId);
    
    // Filter out the removed annotation
    const updatedAnnotations = annotations.filter(annotation => annotation.id !== annotationId);
    
    // Check if the removed annotation has a preset color and label that needs to be removed from Additional Notes
    if (annotationToRemove?.label && annotationData && onAnnotationDataChange) {
      const presetColorName = PRESET_COLOR_NAMES[annotationToRemove.color.toLowerCase()];
      
      if (presetColorName) {
        const labelEntry = `${presetColorName}: ${annotationToRemove.label}`;
        const existingNotes = annotationData.additionalNotes || '';
        
        // Remove the specific entry from Additional Notes
        let updatedAdditionalNotes = existingNotes;
        
        // Handle different positions of the entry (beginning, middle, end)
        if (existingNotes.includes(labelEntry)) {
          // Split by lines to find and remove the exact entry
          const lines = existingNotes.split('\n');
          const filteredLines = lines.filter(line => line !== labelEntry);
          updatedAdditionalNotes = filteredLines.join('\n');
          
          // Clean up any resulting empty lines at the beginning or end
          updatedAdditionalNotes = updatedAdditionalNotes.replace(/^\n+|\n+$/g, '');
        }
        
        // Update both annotations and additional notes
        onAnnotationDataChange({
          ...annotationData,
          additionalNotes: updatedAdditionalNotes,
          boxAnnotations: updatedAnnotations
        });
      } else {
        // No preset color, just update annotations
        onAnnotationsChange(updatedAnnotations);
      }
    } else {
      // No label or no annotation data callback, just update annotations
      onAnnotationsChange(updatedAnnotations);
    }
  }, [annotations, onAnnotationsChange, annotationData, onAnnotationDataChange]);

  // Handle right-click to remove annotation
  const handleAnnotationRightClick = useCallback((e: React.MouseEvent, annotationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeBoxAnnotation(annotationId);
  }, [removeBoxAnnotation]);

  // Handle label confirmation with improved error handling
  const handleLabelConfirm = useCallback(() => {
    if (!labelDialog.annotationId || !isMountedRef.current) return;
    
    // Find the annotation being labeled
    const targetAnnotation = annotations.find(ann => ann.id === labelDialog.annotationId);
    if (!targetAnnotation) {
      // If annotation not found, just close dialog
      setLabelDialog({ isVisible: false, annotationId: null, x: 0, y: 0, label: '' });
      return;
    }

    const label = labelDialog.label.trim();
    
    // Always update the box annotation with the label (even if empty)
    const updatedAnnotations = annotations.map(annotation => 
      annotation.id === labelDialog.annotationId 
        ? { ...annotation, label: label || undefined }
        : annotation
    );

    // Prepare additional notes update for preset colors
    let updatedAdditionalNotes = annotationData?.additionalNotes;
    const presetColorName = PRESET_COLOR_NAMES[targetAnnotation.color.toLowerCase()];
    
    if (label && presetColorName && annotationData) {
      const existingNotes = annotationData.additionalNotes || '';
      const labelEntry = `${presetColorName}: ${label}`;
      
      // Append to existing notes with proper formatting
      updatedAdditionalNotes = existingNotes 
        ? `${existingNotes}\n${labelEntry}`
        : labelEntry;
    }

    // Make a single combined update with both annotations and additional notes
    try {
      if (onAnnotationDataChange && annotationData) {
        onAnnotationDataChange({
          ...annotationData,
          additionalNotes: updatedAdditionalNotes,
          boxAnnotations: updatedAnnotations
        });
      } else {
        // Fallback to just updating annotations if no combined callback
        onAnnotationsChange(updatedAnnotations);
      }
    } catch (error) {
      console.error('Error updating annotation data:', error);
      // Still try to close dialog even if update fails
    }
    
    setLabelDialog({ isVisible: false, annotationId: null, x: 0, y: 0, label: '' });
  }, [labelDialog, annotations, onAnnotationsChange, annotationData, onAnnotationDataChange]);

  // Handle label cancellation
  const handleLabelCancel = useCallback(() => {
    if (!isMountedRef.current) return;
    setLabelDialog({ isVisible: false, annotationId: null, x: 0, y: 0, label: '' });
  }, []);

  // Handle label input change
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current) return;
    setLabelDialog(prev => ({ ...prev, label: e.target.value }));
  }, []);

  // Handle Enter key in label input
  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelConfirm();
    } else if (e.key === 'Escape') {
      handleLabelCancel();
    }
  }, [handleLabelConfirm, handleLabelCancel]);

  // Memoized current drawing box to avoid unnecessary re-renders
  const currentDrawingBox = useMemo(() => {
    if (!drawingState.isDrawing) return null;
    
    const { startX, startY, currentX, currentY } = drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    return (
      <div
        className={styles.drawingBox}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: `${height}%`,
          border: `2px solid ${annotationColor}`,
          backgroundColor: 'transparent'
        }}
      />
    );
  }, [drawingState, annotationColor]);

  // Memoized saved annotations to avoid unnecessary re-renders
  const savedAnnotations = useMemo(() => {
    // Only show existing box annotations when in box annotation mode
    if (!isAnnotationMode) return null;
    
    return annotations.map((annotation) => (
      <div
        key={annotation.id}
        className={styles.savedAnnotationBox}
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          width: `${annotation.width}%`,
          height: `${annotation.height}%`,
          border: `2px solid ${annotation.color}`,
          backgroundColor: 'transparent',
          pointerEvents: 'auto' // Always allow interactions with saved boxes
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          removeBoxAnnotation(annotation.id);
        }}
        onContextMenu={(e) => handleAnnotationRightClick(e, annotation.id)}
        title={`${annotation.label ? `Label: ${annotation.label}\n` : ''}Double-click or right-click to remove`}
      >
        {annotation.label && (
          <div className={styles.annotationLabel}>
            {annotation.label}
          </div>
        )}
      </div>
    ));
  }, [annotations, isAnnotationMode, removeBoxAnnotation, handleAnnotationRightClick]);

  // Memoized label dialog to avoid unnecessary re-renders
  const labelDialogElement = useMemo(() => {
    if (!labelDialog.isVisible) return null;
    
    // Check if current annotation uses a preset color
    const targetAnnotation = annotations.find(ann => ann.id === labelDialog.annotationId);
    const isPresetColor = targetAnnotation && PRESET_COLOR_NAMES[targetAnnotation.color.toLowerCase()];
    
    return (
      <div
        className={styles.labelDialog}
        style={{
          position: 'fixed',
          left: `${labelDialog.x}px`,
          top: `${labelDialog.y}px`,
          zIndex: 1000
        }}
      >
        <div className={styles.labelDialogContent}>
          <div className={styles.labelDialogTitle}>Add Label (Optional)</div>
          <div className={styles.labelDialogNote}>
            {isPresetColor 
              ? `Note: Labels for preset colors will appear in PDF reports under Additional Notes.`
              : `Note: Labels for custom colors are for organization only and will not appear in PDF reports.`
            }
          </div>
          <input
            type="text"
            value={labelDialog.label}
            onChange={handleLabelChange}
            onKeyDown={handleLabelKeyDown}
            placeholder="Enter label..."
            className={styles.labelInput}
            autoFocus
          />
          <div className={styles.labelDialogButtons}>
            <button
              onClick={handleLabelConfirm}
              className={styles.labelConfirmButton}
            >
              Confirm
            </button>
            <button
              onClick={handleLabelCancel}
              className={styles.labelCancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }, [
    labelDialog, 
    annotations, 
    handleLabelChange, 
    handleLabelKeyDown, 
    handleLabelConfirm, 
    handleLabelCancel
  ]);

  return (
    <>
      <div 
        className={`${styles.boxAnnotationsOverlay} ${className || ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: isAnnotationMode ? 'crosshair' : 'default',
          pointerEvents: isAnnotationMode ? 'auto' : 'none' // Only allow interactions in annotation mode
        }}
      >
        {savedAnnotations}
        {currentDrawingBox}
      </div>
      {labelDialogElement}
    </>
  );
};