/* eslint-disable jsx-a11y/img-redundant-alt */
import { useEffect, useState } from 'react';
import styles from './canvas.module.css';

interface CanvasProps {
  imageUrl?: string;
  error?: string;
  isHidden?: boolean;  
}

export const Canvas = ({ imageUrl, error }: CanvasProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHidden, setIsHidden] = useState(false);

  // Reset visibility when new image loads
  useEffect(() => {
    if (imageUrl) {
      setIsHidden(false);
    }
  }, [imageUrl]);
  
  // Handle image loading states
  useEffect(() => {
  if (!imageUrl) return;
  
  console.log('Canvas loading image URL:', imageUrl);
  setIsLoading(true);
  setLoadError(undefined);

  const img = new Image();
  img.onload = () => {
    console.log('Image loaded successfully');
    setIsLoading(false);
  };
  
  img.onerror = (e) => {
    console.error('Image load error:', e);
    setLoadError('Failed to load image');
    setIsLoading(false);
  };

  img.src = imageUrl;
  
  return () => {
    img.onload = null;
    img.onerror = null;
  };
}, [imageUrl]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector(`.${styles.canvasContainer}`);
      if (!container) return;

      // Calculate available space (80% height for image, 20% for annotations)
      const availableHeight = container.clientHeight * 0.8;
      
      setDimensions({
        width: container.clientWidth,
        height: availableHeight
      });
    };

    window.addEventListener('resize', handleResize);
    // Initial calculation
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div 
      className={styles.canvasContainer}
      style={{
        '--canvas-width': `${dimensions.width}px`,
        '--canvas-height': `${dimensions.height}px`
      } as React.CSSProperties}
    >
      {loadError || error ? (
        <p className={styles.error}>{loadError || error}</p>
      ) : isLoading ? (
        <p className={styles.loading}>Loading image...</p>
      ) : imageUrl ? (
        <div className={isHidden ? styles.hidden : ''}>
        <img 
          src={imageUrl}
          alt="Case Image"
          className={styles.image}
        />
        </div>
      ) : (
        <p className={styles.placeholder}>
          Upload or select an image to get started
        </p>
      )}
    </div>
  );
};