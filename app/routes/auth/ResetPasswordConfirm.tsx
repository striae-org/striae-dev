import { FormEvent } from 'react';
import styles from './login.module.css';

interface ResetPasswordConfirmProps {
  email: string;
  isLoading: boolean;
  error: string;
  passwordStrength: string;
  onPasswordChange: (password: string) => void;
  onSubmit: (password: string) => void;
}

export function ResetPasswordConfirm({
  email,
  isLoading,
  error,
  passwordStrength,
  onPasswordChange,
  onSubmit
}: ResetPasswordConfirmProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (newPassword === confirmPassword) {
      onSubmit(newPassword);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Reset Password</h2>
      <p>Enter new password for {email}</p>
      <input
        type="password"
        name="newPassword"
        placeholder="New Password"
        className={styles.input}
        required
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        className={styles.input}
        required
      />
      {passwordStrength && (
        <div className={styles.passwordStrength}>
          <pre>{passwordStrength}</pre>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.button} disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}