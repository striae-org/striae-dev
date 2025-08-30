import { useState, useEffect } from 'react';
import { 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator, 
  RecaptchaVerifier,
  MultiFactorResolver,
  UserCredential
} from 'firebase/auth';
import { auth } from '~/services/firebase';
import styles from './mfa-verification.module.css';

interface MFAVerificationProps {
  resolver: MultiFactorResolver;
  onSuccess: (result: UserCredential) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export const MFAVerification = ({ resolver, onSuccess, onError, onCancel }: MFAVerificationProps) => {
  const [selectedHintIndex, setSelectedHintIndex] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Initialize reCAPTCHA verifier
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      }
    });
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, [isClient]);

  const sendVerificationCode = async () => {
    if (!recaptchaVerifier) return;

    setLoading(true);
    try {
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[selectedHintIndex],
        session: resolver.session
      };

      const vId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
      setVerificationId(vId);
      setCodeSent(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      onError(errorMessage);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationId || !verificationCode) return;

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      const result = await resolver.resolveSignIn(multiFactorAssertion);
      onSuccess(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedHint = resolver.hints[selectedHintIndex];
  const maskedPhoneNumber = selectedHint?.displayName || 'your phone';

  if (!isClient) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Two-Factor Authentication Required</h2>
        
        {resolver.hints.length > 1 && (
          <div className={styles.hintSelection}>
            <label htmlFor="hint-select" className={styles.label}>Choose verification method:</label>
            <select 
              id="hint-select"
              title="Select verification method"
              value={selectedHintIndex} 
              onChange={(e) => setSelectedHintIndex(Number(e.target.value))}
              className={styles.select}
            >
              {resolver.hints.map((hint, index) => (
                <option key={index} value={index}>
                  {hint.displayName || `Phone verification ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {!codeSent ? (
          <div className={styles.sendCode}>
            <p className={styles.description}>
              We&apos;ll send a verification code to {maskedPhoneNumber}
            </p>
            <button 
              onClick={sendVerificationCode} 
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        ) : (
          <div className={styles.verifyCode}>
            <p className={styles.description}>
              Enter the verification code sent to {maskedPhoneNumber}
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={styles.input}
              maxLength={6}
            />
            <div className={styles.buttons}>
              <button 
                onClick={verifyCode} 
                disabled={loading || verificationCode.length !== 6}
                className={styles.button}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                  setVerificationId('');
                }}
                className={styles.secondaryButton}
              >
                Send New Code
              </button>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>        
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};
