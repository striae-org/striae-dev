import { User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Sidebar } from '~/components/sidebar/sidebar';
import { Toolbar } from '~/components/toolbar/toolbar';
import { Canvas } from '~/components/canvas/canvas';
import { Annotations } from '~/components/annotations/annotations';
import { getImageUrl } from '~/components/actions/image-manage';
import styles from './striae.module.css';

interface StriaePage {
  user: User;    
}

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

export const Striae = ({ user }: StriaePage) => {
  // Image and error states
  const [selectedImage, setSelectedImage] = useState<string>();
  const [imageId, setImageId] = useState<string>();
  const [error, setError] = useState<string>();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Case management states - All managed here
  const [currentCase, setCurrentCase] = useState<string>('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [caseNumber, setCaseNumber] = useState('');
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | 'deleted' | null>(null);
  const [showNotes, setShowNotes] = useState(false);


   useEffect(() => {
    // Set clear.jpg when case changes or is cleared
    setSelectedImage('/clear.jpg');
    setError(undefined);
    setImageLoaded(false);
  }, [currentCase]);

  const handleCaseChange = (caseNumber: string) => {
    setCurrentCase(caseNumber);
  };

  useEffect(() => {
    // Cleanup function to clear image when component unmounts
    return () => {
      setSelectedImage(undefined);
      setError(undefined);
      setImageLoaded(false);
    };
  }, []); // Empty dependency array means this runs only on mount/unmount


  const handleImageSelect = async (file: FileData) => {
  // Handle special clear case
  if (file?.id === 'clear') {
    setSelectedImage('/clear.jpg');
    setImageId(undefined);
    setImageLoaded(false);
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
      setImageLoaded(false);
    
    const signedUrl = await getImageUrl(file);
    if (!signedUrl) throw new Error('No URL returned');

    setSelectedImage(signedUrl);
      setImageId(file.id); 
      setImageLoaded(true);

  } catch (err) {
    setError('Failed to load image. Please try again.');
    console.error('Image selection error:', err);
    setSelectedImage(undefined);
  }
};

  return (
    <div className={styles.appContainer}>
     <Sidebar 
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
      />
      <main className={styles.mainContent}>
        <div className={styles.canvasArea}>
          <div className={styles.toolbarWrapper}>
            <Toolbar />
          </div>
          <Canvas imageUrl={selectedImage} error={error ?? ''} />
        </div>
        <Annotations />
      </main>
    </div>
  );
};