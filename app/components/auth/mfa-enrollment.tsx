/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { auth } from '~/services/firebase';
import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  multiFactor,
  User
} from 'firebase/auth';
import { handleAuthError } from '~/services/firebase-errors';
import styles from './mfa-enrollment.module.css';

interface MFAEnrollmentProps {
  user: User;
  onSuccess: () => void;
  onError: (error: string) => void;
  onSkip?: () => void; // Optional skip for non-mandatory scenarios
  mandatory?: boolean; // Whether MFA enrollment is required
}

export const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({
  user,
  onSuccess,
  onError,
  onSkip,
  mandatory = true
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [verificationId, setVerificationId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Initialize reCAPTCHA verifier
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-enrollment', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow SMS sending
      },
      'expired-callback': () => {
        onError('reCAPTCHA expired. Please try again.');
      }
    });
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, [onError, isClient]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      onError('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifier) {
      onError('reCAPTCHA not initialized. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number if it doesn't start with +
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const multiFactorSession = await multiFactor(user).getSession();
      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session: multiFactorSession
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      setCodeSent(true);
      setResendTimer(60); // 60 second cooldown for resend
      onError(''); // Clear any previous errors
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      onError(handleAuthError(authError).message);
    } finally {
      setIsLoading(false);
    }
  };

  const enrollMFA = async () => {
    if (!verificationCode.trim()) {
      onError('Please enter the verification code');
      return;
    }

    if (!verificationId) {
      onError('No verification ID found. Please request a new code.');
      return;
    }

    setIsLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      await multiFactor(user).enroll(multiFactorAssertion, `Phone: ${phoneNumber}`);
      
      onSuccess();
    } catch (error: unknown) {
      console.error('Error enrolling MFA:', error);
      const authError = error as { code?: string; message?: string };
      if (authError.code === 'auth/invalid-verification-code') {
        onError('Invalid verification code. Please check your code and try again.');
      } else if (authError.code === 'auth/code-expired') {
        onError('Verification code has expired. Please request a new code.');
        setCodeSent(false);
      } else {
        onError(handleAuthError(authError).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip && !mandatory) {
      onSkip();
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Security Setup Required</h2>
          <p>
            {mandatory 
              ? 'Two-factor authentication is required for all accounts. Please set up SMS verification to continue.'
              : 'Enhance your account security with two-factor authentication.'
            }
          </p>
        </div>

        <div className={styles.content}>
          {!codeSent ? (
            <div className={styles.phoneStep}>
              <h3>Step 1: Enter Your Phone Number (10 digits only)</h3>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5551234567"
                className={styles.input}
                disabled={isLoading}
              />
              <p className={styles.note}>
                We&apos;ll send a verification code to this number.
              </p>
              <button
                onClick={sendVerificationCode}
                disabled={isLoading || !phoneNumber.trim()}
                className={styles.primaryButton}
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div className={styles.codeStep}>
              <h3>Step 2: Enter Verification Code</h3>
              <p className={styles.note}>
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                className={styles.input}
                disabled={isLoading}
              />
              
              <div className={styles.buttonGroup}>
                <button
                  onClick={enrollMFA}
                  disabled={isLoading || verificationCode.length !== 6}
                  className={styles.primaryButton}
                >
                  {isLoading ? 'Verifying...' : 'Complete Setup'}
                </button>
                
                <button
                  onClick={() => {
                    setCodeSent(false);
                    setVerificationCode('');
                  }}
                  disabled={isLoading}
                  className={styles.secondaryButton}
                >
                  Change Phone Number
                </button>
                
                {resendTimer === 0 ? (
                  <button
                    onClick={sendVerificationCode}
                    disabled={isLoading}
                    className={styles.secondaryButton}
                  >
                    Resend Code
                  </button>
                ) : (
                  <p className={styles.resendTimer}>
                    Resend code in {resendTimer}s
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {!mandatory && (
          <div className={styles.footer}>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className={styles.skipButton}
            >
              Skip for now
            </button>
          </div>
        )}

        <div id="recaptcha-container-enrollment" />
      </div>
    </div>
  );
};
