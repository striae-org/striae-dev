import { useEffect, useState } from 'react';
import styles from './canvas.module.css';

interface CanvasProps {
  imageUrl?: string;
  error?: string;
}

type ImageLoadError = {
  type: 'load' | 'network' | 'invalid';
  message: string;
}

export const Canvas = ({ imageUrl, error }: CanvasProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<ImageLoadError | undefined>();

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

  const getErrorMessage = () => {
    if (error) return error;
    if (loadError) return loadError.message;
    return 'An error occurred';
  };

  return (
    <div className={styles.canvasContainer}>
      {(loadError || error) ? (
        <p className={styles.error}>{getErrorMessage()}</p>
      ) : isLoading ? (
        <p className={styles.loading}>Loading image...</p>
      ) : imageUrl && imageUrl !== '/clear.jpg' ? (
        <img 
          src={imageUrl}
          alt="Case evidence"
          className={styles.image}
          onError={() => setLoadError({
            type: 'network',
            message: 'Failed to load image from network'
          })}
        />
      ) : (
        <p className={styles.placeholder}>
          Upload or select an image to get started
        </p>
      )}
    </div>
  );
};