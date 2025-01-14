import { useEffect, useState } from 'react';
import styles from './canvas.module.css';

interface CanvasProps {
  imageUrl?: string;
  error?: string;
}

export const Canvas = ({ imageUrl, error }: CanvasProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle image loading states
  useEffect(() => {
  if (!imageUrl) return;
  
  setIsLoading(true);
  setLoadError(undefined);

  const img = new Image();
  img.src = imageUrl;
  
  img.onload = () => {
    setIsLoading(false);
  };
  
  img.onerror = () => {
    setLoadError('Failed to load image');
    setIsLoading(false);
    console.error('Image load error:', imageUrl);
  };

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
        <img 
          src={imageUrl}
          alt="Case evidence"
          className={styles.image}
        />
      ) : (
        <p className={styles.placeholder}>
          Upload or select an image to get started
        </p>
      )}
    </div>
  );
};