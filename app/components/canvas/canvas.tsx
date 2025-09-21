import { useEffect, useState, useRef, useContext } from 'react';
import { BoxAnnotations } from './box-annotations/box-annotations';
import { ConfirmationModal } from './confirmation/confirmation';
import { AnnotationData, BoxAnnotation } from '~/types/annotations';
import { AuthContext } from '~/contexts/auth.context';
import { storeConfirmation } from '~/components/actions/confirm-export';
import styles from './canvas.module.css';

interface CanvasProps {
  imageUrl?: string;
  filename?: string;
  company?: string;
  firstName?: string;
  error?: string;
  activeAnnotations?: Set<string>;
  annotationData?: AnnotationData | null;
  onAnnotationUpdate?: (annotationData: AnnotationData) => void;
  isBoxAnnotationMode?: boolean;
  boxAnnotationColor?: string;
  isReadOnly?: boolean;
  // Confirmation data for storing case-level confirmations
  caseNumber?: string;
  currentImageId?: string;
}

type ImageLoadError = {
  type: 'load' | 'network' | 'invalid';
  message: string;
}

export const Canvas = ({ 
  imageUrl, 
  filename, 
  company, 
  firstName, 
  error, 
  activeAnnotations, 
  annotationData,
  onAnnotationUpdate,
  isBoxAnnotationMode = false,
  boxAnnotationColor = '#FF0000',
  isReadOnly = false,
  caseNumber,
  currentImageId
}: CanvasProps) => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<ImageLoadError | undefined>();
  const [isFlashing, setIsFlashing] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle box annotation changes
  const handleBoxAnnotationsChange = (boxAnnotations: BoxAnnotation[]) => {
    if (!onAnnotationUpdate || !annotationData || isReadOnly) return;
    
    const updatedAnnotationData: AnnotationData = {
      ...annotationData,
      boxAnnotations
    };
    
    onAnnotationUpdate(updatedAnnotationData);
  };

  // Handle annotation data changes (for additional notes updates)
  const handleAnnotationDataChange = (data: { additionalNotes?: string; boxAnnotations?: BoxAnnotation[] }) => {
    if (!onAnnotationUpdate || !annotationData || isReadOnly) return;
    
    const updatedAnnotationData: AnnotationData = {
      ...annotationData,
      ...data
    };
    
    onAnnotationUpdate(updatedAnnotationData);
  };

  // Handle confirmation
  const handleConfirmation = async (confirmationData: {
    fullName: string;
    badgeId: string;
    timestamp: string;
    confirmationId: string;
  }) => {
    if (!onAnnotationUpdate || !annotationData) return;
    
    // Store in annotation data (existing functionality)
    const updatedAnnotationData: AnnotationData = {
      ...annotationData,
      confirmationData
    };
    
    onAnnotationUpdate(updatedAnnotationData);
    console.log('Confirmation data saved to annotation:', confirmationData);

    // Store at case level for original analyst tracking
    if (user && caseNumber && currentImageId) {
      const success = await storeConfirmation(
        user,
        caseNumber,
        currentImageId,
        confirmationData
      );
      
      if (success) {
        console.log('Confirmation stored at case level for original image tracking');
      } else {
        console.error('Failed to store confirmation at case level');
      }
    } else {
      console.warn('Missing required data for case-level confirmation storage:', {
        hasUser: !!user,
        caseNumber,
        currentImageId
      });
    }
  };

  useEffect(() => {
    if (!imageUrl) {
      setLoadError(undefined);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(undefined);

    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setLoadError(undefined);
    };
    
    img.onerror = (e) => {
      setLoadError({
        type: 'load',
        message: `Failed to load image: ${e instanceof Error ? e.message : 'Unknown error'}`
      });
      setIsLoading(false);
    };

    try {
      img.src = imageUrl;
    } catch (e) {
      setLoadError({
        type: 'invalid',
        message: 'Invalid image URL provided'
      });
      setIsLoading(false);
    }
    
    return () => {
      img.onload = null;
      img.onerror = null;
      setLoadError(undefined);
      setIsLoading(false);
    };
  }, [imageUrl]);
  
  useEffect(() => {
    if (!activeAnnotations?.has('class') || !annotationData?.hasSubclass) {
      setIsFlashing(false);
      return;
    }

    const flashInterval = setInterval(() => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);
      setTimeout(() => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);
      }, 300);
    }, 60000);

    return () => clearInterval(flashInterval);
  }, [activeAnnotations, annotationData?.hasSubclass]);

  const getErrorMessage = () => {
    if (error) return error;
    if (loadError) return loadError.message;
    return 'An error occurred';
  };
  
  const isBlackColor = (color: string) => {
    return color.toLowerCase() === '#000000' || color.toLowerCase() === 'black' || color.toLowerCase() === '#000';
  };

  return (    
    <div className={styles.canvasContainer}>
      {/* Filename & Connfirmation Field Display - Upper Left */}
      {filename && (
        <div className={styles.filenameDisplay}>
          File: {filename}
          {annotationData?.includeConfirmation && (
            <>
              <div className={styles.confirmationIncluded}>
                {isReadOnly ? 'Confirmation Requested' : 'Confirmation Field Included'}
              </div>
              {isReadOnly && (
                <button 
                  className={styles.confirmButton}
                  onClick={() => setIsConfirmationModalOpen(true)}
                >
                  Confirm
                </button>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Company Display - Upper Right */}
      {company && (
        <div className={styles.companyDisplay}>
          {isReadOnly ? 'CASE REVIEW ONLY' : company}
        </div>
      )}
      
      {(loadError || error) ? (
        <p className={styles.error}>{getErrorMessage()}</p>
      ) : isLoading ? (
        <p className={styles.loading}>Loading image...</p>
      ) : imageUrl && imageUrl !== '/clear.jpg' ? (
        <div className={styles.imageAndNotesContainer}>
          <div className={styles.imageContainer}>
            {/* Class Characteristics - Above Image */}
            {activeAnnotations?.has('class') && annotationData && (annotationData.customClass || annotationData.classType) && (
              <div className={styles.classCharacteristics}>
                <div className={styles.classText}>
                  {annotationData.customClass || annotationData.classType}
                  {annotationData.classNote && ` (${annotationData.classNote})`}
                </div>
              </div>
            )}
            
            <img 
            ref={imageRef}
            src={imageUrl}
            alt="Case evidence"
            className={styles.image}
            style={{
              border: activeAnnotations?.has('index') && annotationData?.indexType === 'color' && annotationData?.indexColor
                ? `6px solid ${annotationData.indexColor}`
                : undefined,
              userSelect: 'none'
            }}
            onError={() => setLoadError({
              type: 'network',
              message: 'Failed to load image from network'
            })}
            draggable={false}
          />
          
          {/* Box Annotations Component - Show when box tool is active for visibility */}
          {activeAnnotations?.has('box') && (
            <BoxAnnotations
              imageRef={imageRef}
              annotations={annotationData?.boxAnnotations || []}
              onAnnotationsChange={handleBoxAnnotationsChange}
              isAnnotationMode={isBoxAnnotationMode}
              annotationColor={boxAnnotationColor}
              annotationData={annotationData ? { additionalNotes: annotationData.additionalNotes } : undefined}
              onAnnotationDataChange={handleAnnotationDataChange}
              isReadOnly={isReadOnly}
            />
          )}
          
          {/* Annotations Overlay */}
          {activeAnnotations?.has('number') && annotationData && (
            <div className={styles.annotationsOverlay}>
              {/* Left side case and item numbers */}
              <div 
                className={styles.leftAnnotation}
                style={{ 
                  color: annotationData.caseFontColor || '#FFDE21',
                  backgroundColor: isBlackColor(annotationData.caseFontColor || '#FFDE21')
                    ? 'rgba(255, 255, 255, 0.9)' : undefined
                }}
              >
                <div className={styles.caseText}>
                  {annotationData.leftCase}
                  {annotationData.leftItem && ` ${annotationData.leftItem}`}
                </div>
              </div>
              
              {/* Right side case and item numbers */}
              <div 
                className={styles.rightAnnotation}
                style={{ 
                  color: annotationData.caseFontColor || '#FFDE21',
                  backgroundColor: isBlackColor(annotationData.caseFontColor || '#FFDE21')
                    ? 'rgba(255, 255, 255, 0.9)' : undefined
                }}
              >
                <div className={styles.caseText}>
                  {annotationData.rightCase}
                  {annotationData.rightItem && ` ${annotationData.rightItem}`}
                </div>
              </div>
            </div>
          )}
          
          {/* Index Number Overlay */}
          {activeAnnotations?.has('index') && annotationData?.indexType === 'number' && annotationData?.indexNumber && (
            <div className={styles.annotationsOverlay}>
              <div 
                className={styles.indexAnnotation}
                style={{ 
                  color: annotationData.caseFontColor || '#FFDE21',
                  backgroundColor: isBlackColor(annotationData.caseFontColor || '#FFDE21')
                    ? 'rgba(255, 255, 255, 0.9)' : undefined
                }}
              >
                <div className={styles.caseText}>
                  Index: {annotationData.indexNumber}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Notes - Below Image */}
        {activeAnnotations?.has('notes') && annotationData?.additionalNotes && (
          <div className={styles.additionalNotesContainer}>
            <div className={styles.additionalNotesBox}>
              {annotationData.additionalNotes}
            </div>
          </div>
        )}
        </div>
      ) : (
        <p 
          className={styles.placeholder}
          dangerouslySetInnerHTML={{
            __html: firstName 
              ? `Hello, ${firstName}<br>Upload or select an image to get started`
              : 'Upload or select an image to get started'
          }}
        />
      )}
      
      {/* Support Level - Bottom Left of Canvas */}
      {activeAnnotations?.has('id') && annotationData && annotationData.supportLevel && (
        <div className={styles.supportLevelAnnotation}>
          <div 
            className={styles.supportLevelText}
            style={{ 
              color: annotationData.supportLevel === 'ID' ? '#28a745' : 
                     annotationData.supportLevel === 'Exclusion' ? '#dc3545' : 
                     '#ffc107' 
            }}
          >
            {annotationData.supportLevel === 'ID' ? 'Identification' : annotationData.supportLevel}
          </div>
        </div>
      )}
      
      {/* Subclass Warning - Bottom Right of Canvas */}
      {activeAnnotations?.has('class') && annotationData?.hasSubclass && (
        <div className={`${styles.subclassWarning} ${isFlashing ? styles.flashing : ''}`}>
          <div className={styles.subclassText}>
            POTENTIAL SUBCLASS
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmation}
        company={company}
        existingConfirmation={annotationData?.confirmationData || null}
      />
    </div>    
  );
};