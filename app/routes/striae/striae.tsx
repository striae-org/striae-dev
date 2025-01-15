import { User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Sidebar } from '~/components/sidebar/sidebar';
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
  const [selectedImage, setSelectedImage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isHidden, setIsHidden] = useState(false);

  const handleToggleHide = (hidden: boolean) => {
    setIsHidden(hidden);
  };

  useEffect(() => {
    // Cleanup function to clear image when component unmounts
    return () => {
      setSelectedImage(undefined);
      setError(undefined);
    };
  }, []); // Empty dependency array means this runs only on mount/unmount


  const handleImageSelect = async (file: FileData) => {
  if (!file?.id) {
    setError('Invalid file selected');
    return;
  }

  try {
    setError(undefined);
    setSelectedImage(undefined);
    
    const signedUrl = await getImageUrl(file);
    if (!signedUrl) throw new Error('No URL returned');
    setSelectedImage(signedUrl);
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
        onToggleHide={handleToggleHide} />
      <main className={styles.mainContent}>
        <Canvas imageUrl={selectedImage} error={error} isHidden={isHidden} />
        <Annotations />
      </main>
    </div>
  );
};