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

  useEffect(() => {
    // Cleanup function to clear image when component unmounts
    return () => {
      setSelectedImage(undefined);
      setError(undefined);
    };
  }, []); // Empty dependency array means this runs only on mount/unmount


  const handleImageSelect = async (file: FileData) => {
    try {
      const url = await getImageUrl(file);
      setSelectedImage(url);
    } catch (err) {
      setError('Failed to load image');
      console.error(err);
    }
  };

  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} onImageSelect={handleImageSelect} />
      <main className={styles.mainContent}>
        <Canvas imageUrl={selectedImage} error={error} />
        <Annotations />
      </main>
    </div>
  );
};