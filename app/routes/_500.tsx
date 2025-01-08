import { Link } from '@remix-run/react';
import { baseMeta } from '~/utils/meta';
import styles from '~/styles/error.module.css';

export const meta = () => {
  return baseMeta({
    title: '500 - Server Error',
    description: 'An unexpected error occurred.',
  });
};

export default function ServerError() {
  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorTitle}>500</h1>
      <p className={styles.errorMessage}>Something went wrong. Please try again later.</p>
      <Link to="/" className={styles.errorLink}>Return Home</Link>
    </div>
  );
}