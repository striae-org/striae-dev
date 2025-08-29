import { User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { SidebarContainer } from '~/components/sidebar/sidebar-container';
import { Toolbar } from '~/components/toolbar/toolbar';
import { Canvas } from '~/components/canvas/canvas';
import { Toast } from '~/components/toast/toast';
import { getImageUrl } from '~/components/actions/image-manage';
import { getNotes } from '~/components/actions/notes-manage';
import { getUserApiKey } from '~/utils/auth';
import paths from '~/config/config.json';
import styles from './striae.module.css';

interface StriaePage {
  user: User;    
}

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface AnnotationData {
  leftCase: string;
  rightCase: string;
  leftItem: string;
  rightItem: string;
  caseFontColor: string;
  classType: 'Bullet' | 'Cartridge Case' | 'Other';
  customClass?: string;
  classNote: string;
  indexType: 'number' | 'color';
  indexNumber?: string;
  indexColor?: string;
  supportLevel: 'ID' | 'Exclusion' | 'Inconclusive';
  hasSubclass?: boolean;
  includeConfirmation: boolean;
  additionalNotes: string;
  updatedAt?: string;
}

export const Striae = ({ user }: StriaePage) => {
  // Image and error states
  const [selectedImage, setSelectedImage] = useState<string>();
  const [selectedFilename, setSelectedFilename] = useState<string>();
  const [imageId, setImageId] = useState<string>();
  const [error, setError] = useState<string>();
  const [imageLoaded, setImageLoaded] = useState(false);

  // User states
  const [userCompany, setUserCompany] = useState<string>('');
  const [userFirstName, setUserFirstName] = useState<string>('');

  // Case management states - All managed here
  const [currentCase, setCurrentCase] = useState<string>('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [caseNumber, setCaseNumber] = useState('');
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | 'deleted' | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  // Annotation states
  const [activeAnnotations, setActiveAnnotations] = useState<Set<string>>(new Set());
  const [annotationData, setAnnotationData] = useState<AnnotationData | null>(null);
  const [annotationRefreshTrigger, setAnnotationRefreshTrigger] = useState(0);

  // PDF generation states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');


   useEffect(() => {
    // Set clear.jpg when case changes or is cleared
    setSelectedImage('/clear.jpg');
    setSelectedFilename(undefined);
    setImageId(undefined);
    setAnnotationData(null);    
    setError(undefined);
    setImageLoaded(false);
  }, [currentCase]);

  // Fetch user company data when component mounts
  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        const apiKey = await getUserApiKey();
        const response = await fetch(`${paths.user_worker_url}/${user.uid}`, {
          headers: {
            'X-Custom-Auth-Key': apiKey
          }
        });
        
        if (response.ok) {
          const userData = await response.json() as { company?: string; firstName?: string };
          setUserCompany(userData.company || '');
          setUserFirstName(userData.firstName || '');
        }
      } catch (err) {
        console.error('Failed to load user company:', err);
      }
    };
    
    if (user?.uid) {
      fetchUserCompany();
    }
  }, [user?.uid]);

  const handleCaseChange = (caseNumber: string) => {
    setCurrentCase(caseNumber);
    setAnnotationData(null);
    setSelectedFilename(undefined);
    setImageId(undefined);    
  };

  // Handler for toolbar annotation selection
  const handleToolSelect = (toolId: string, active: boolean) => {
    setActiveAnnotations(prev => {
      const next = new Set(prev);
      if (active) {
        next.add(toolId);
      } else {
        next.delete(toolId);
      }
      return next;
    });
  };  

  // Generate PDF function
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    // Show generating toast immediately
    setToastType('success');
    setToastMessage('Generating PDF report... This may take up to a minute.');
    setShowToast(true);
    
    try {
      // Format current date in user's timezone
      const now = new Date();
      const currentDate = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;
      
      // Format notes updated date in user's timezone if it exists
      let notesUpdatedFormatted = '';
      if (annotationData?.updatedAt) {
        const updatedDate = new Date(annotationData.updatedAt);
        notesUpdatedFormatted = `${(updatedDate.getMonth() + 1).toString().padStart(2, '0')}/${updatedDate.getDate().toString().padStart(2, '0')}/${updatedDate.getFullYear()}`;
      }

      const pdfData = {
        imageUrl: selectedImage,
        filename: selectedFilename,
        company: userCompany,
        firstName: userFirstName,
        caseNumber: currentCase,
        annotationData,
        activeAnnotations: Array.from(activeAnnotations), // Convert Set to Array
        currentDate, // Pass formatted current date
        notesUpdatedFormatted // Pass formatted notes updated date
      };

      const response = await fetch(paths.pdf_worker_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename based on annotation data
        let filename = 'striae-report';
        
        if (annotationData) {
          const { leftCase, leftItem, rightCase, rightItem } = annotationData;
          
          // Build left and right parts
          const leftPart = [leftCase, leftItem].filter(Boolean).join('-');
          const rightPart = [rightCase, rightItem].filter(Boolean).join('-');
          
          if (leftPart && rightPart) {
            filename = `striae-report-${leftPart}--${rightPart}`;
          } else if (leftPart) {
            filename = `striae-report-${leftPart}`;
          } else if (rightPart) {
            filename = `striae-report-${rightPart}`;
          }
        }
        
        // Fallback to case number if no annotation data
        if (filename === 'striae-report' && currentCase) {
          filename = `striae-report-${currentCase}`;
        }
        
        // Final fallback to timestamp
        if (filename === 'striae-report') {
          filename = `striae-report-${Date.now()}`;
        }
        
        // Sanitize filename and ensure .pdf extension
        filename = filename.replace(/[<>:"/\\|?*]/g, '-') + '.pdf';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success toast
        setToastType('success');
        setToastMessage('PDF generated successfully!');
        setShowToast(true);
      } else {
        const errorText = await response.text();
        console.error('PDF generation failed:', errorText);
        setToastType('error');
        setToastMessage('Failed to generate PDF report');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToastType('error');
      setToastMessage('Error generating PDF report');
      setShowToast(true);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Close toast notification
  const closeToast = () => {
    setShowToast(false);
  };

  // Function to refresh annotation data (called when notes are saved)
  const refreshAnnotationData = () => {
    setAnnotationRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Cleanup function to clear image when component unmounts
    return () => {
      setSelectedImage(undefined);
      setSelectedFilename(undefined);
      setError(undefined);
      setImageLoaded(false);
      setAnnotationData(null);
    };
  }, []); // Empty dependency array means this runs only on mount/unmount

  // Load annotation data when imageId changes
  useEffect(() => {
    const loadAnnotationData = async () => {
      if (!imageId || !currentCase) {
        setAnnotationData(null);
        return;
      }

      try {
        const notes = await getNotes(user, currentCase, imageId);
        if (notes) {
          setAnnotationData({
            leftCase: notes.leftCase || '',
            rightCase: notes.rightCase || '',
            leftItem: notes.leftItem || '',
            rightItem: notes.rightItem || '',
            caseFontColor: notes.caseFontColor || '#FFDE21',
            classType: notes.classType || 'Other',
            customClass: notes.customClass,
            classNote: notes.classNote || '',
            indexType: notes.indexType || 'number',
            indexNumber: notes.indexNumber,
            indexColor: notes.indexColor,
            supportLevel: notes.supportLevel || 'Inconclusive',
            hasSubclass: notes.hasSubclass,
            includeConfirmation: notes.includeConfirmation || false,
            additionalNotes: notes.additionalNotes || '',
            updatedAt: notes.updatedAt
          });
        } else {
          setAnnotationData(null);
        }
      } catch (error) {
        console.error('Failed to load annotation data:', error);
        setAnnotationData(null);
      }
    };

    loadAnnotationData();
  }, [imageId, currentCase, user, annotationRefreshTrigger]);


  const handleImageSelect = async (file: FileData) => {  
  if (file?.id === 'clear') {
    setSelectedImage('/clear.jpg');
    setSelectedFilename(undefined);
    setImageId(undefined);
    setImageLoaded(false);
    setAnnotationData(null);
    setError(undefined);
    return;
  }

  if (!file?.id) {
    setError('Invalid file selected');
    return;
  }

  try {
      setError(undefined);
      setSelectedImage(undefined);
      setSelectedFilename(undefined);
      setImageLoaded(false);
    
    const signedUrl = await getImageUrl(file);
    if (!signedUrl) throw new Error('No URL returned');

    setSelectedImage(signedUrl);
      setSelectedFilename(file.originalFilename);
      setImageId(file.id); 
      setImageLoaded(true);

  } catch (err) {
    setError('Failed to load image. Please try again.');
    console.error('Image selection error:', err);
    setSelectedImage(undefined);
    setSelectedFilename(undefined);
  }
};

  return (
    <div className={styles.appContainer}>
     <SidebarContainer 
        user={user} 
        onImageSelect={handleImageSelect}
        imageId={imageId}
        onCaseChange={handleCaseChange}
        currentCase={currentCase}
        setCurrentCase={setCurrentCase}
        imageLoaded={imageLoaded}
        setImageLoaded={setImageLoaded}
        files={files}
        setFiles={setFiles}
        caseNumber={caseNumber}
        setCaseNumber={setCaseNumber}
        error={error ?? ''}
        setError={setError}
        successAction={successAction}
        setSuccessAction={setSuccessAction}
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        onAnnotationRefresh={refreshAnnotationData}
      />
      <main className={styles.mainContent}>
        <div className={styles.canvasArea}>
          <div className={styles.toolbarWrapper}>
            <Toolbar 
              onToolSelect={handleToolSelect}
              onGeneratePDF={generatePDF}
              canGeneratePDF={!!(selectedImage && selectedImage !== '/clear.jpg')}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
          <Canvas 
            imageUrl={selectedImage} 
            filename={selectedFilename}
            company={userCompany}
            firstName={userFirstName}
            error={error ?? ''}
            activeAnnotations={activeAnnotations}
            annotationData={annotationData}
          />
        </div>
      </main>
      
      {/* Toast notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={closeToast}
      />
    </div>
  );
};