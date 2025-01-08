import styles from './mobile-warning.module.css';

export default function MobileWarning() {
  return (
    <div className={styles.mobileWarning}>
      <div className={styles.content}>
        <h2>Desktop Only</h2>
        <p>Striae is optimized for desktop use. Please visit us on a computer for the best experience.</p>
      </div>
    </div>
  );
}