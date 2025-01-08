import { useState } from 'react';
import { baseMeta } from '~/utils/meta';
import { Turnstile } from '~/components/turnstile/turnstile';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';
import { verifyTurnstileToken } from '~/utils/turnstile';
import { Form, useActionData, useNavigation, Link } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import styles from './signup.module.css';

const MAX_NAME_LENGTH = 128;
const MAX_EMAIL_LENGTH = 512;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ActionData {
    success?: boolean;
    errors?: {
      firstName?: string;
      email?: string;
    };
}

export const meta = () => {
  return baseMeta({
    title: 'Signup for Striae Beta',
    description:
      'Complete the form to request access to the Striae beta program.',
  });
};

interface Env {
  cloudflare: {
    env: {
      SL_API_KEY: string;
    };
  };
}

export async function action({ request, context }: { request: Request; context: Env }) {
  const formData = await request.formData();
  const firstName = formData.get('firstName') as string;
  const email = formData.get('email') as string;
  const emailConsent = formData.get('emailConsent') === 'on';
  const betaFeedback = formData.get('betaFeedback') === 'on';
  const errors: { firstName?: string; email?: string } = {};

  if (!firstName || firstName.length > MAX_NAME_LENGTH) {
    errors.firstName = 'Please enter a valid name';
  }

  if (!email || !EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    errors.email = 'Please enter a valid email address';
  }

  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ errors }, { status: 400 });
  }

  try {
    const token = formData.get('cf-turnstile-response') as string;
    const verificationResult = await verifyTurnstileToken(token);
    
    if ('success' in verificationResult && !verificationResult.success) {
      return json<ActionData>(
        { errors: { email: 'CAPTCHA verification failed. Please try again.' } },
        { status: 400 }
      );
    }

    const response = await fetch('https://console.sendlayer.com/api/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.cloudflare.env.SL_API_KEY}`,
      },
      body: JSON.stringify({
        "from": {
          "name": "Striae Beta Signup",
          "email": "no-reply@stephenjlu.com"
        },
        "to": [
          {
            "name": "Striae Beta Signup",
            "email": "beta@allyforensics.com"
          }
        ],
        "subject": "New Beta Signup Request",
        "ContentType": "HTML",
        "HTMLContent": `<html><body>
          <h2>New Beta Signup Request</h2>
          <p><strong>Name:</strong> ${firstName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Email Consent:</strong> ${emailConsent}</p>
          <p><strong>Beta Feedback Agreement:</strong> ${betaFeedback}</p>
        </body></html>`,
        "PlainContent": `New Beta Signup Request:

Name: ${firstName}
Email: ${email}
Email Consent: ${emailConsent}
Beta Feedback Agreement: ${betaFeedback}`,
        "Tags": [
          "beta-signup"          
        ],
        "Headers": {
          "X-Mailer": "StephenJLu.com",
          "X-Test": "test header"
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return json({ errors: { email: 'Failed to submit. Please try again.' } }, { status: 500 });
  }
}


export const BetaSignup = () => {
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const actionData = useActionData<ActionData>();
  const { state } = useNavigation();
  const sending = state === 'submitting';

  const signupNotice = {
    title: 'Before You Request Access',
    content: <NoticeText />,
    buttonText: 'I Understand'
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
  <div className={styles.logo} />
</Link>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Join Striae Beta</h1>
         <button 
          type="button"
          onClick={() => setIsNoticeOpen(true)}
          className={styles.noticeButton}
        >
          Read before requesting an invite
        </button>
        <Notice 
          isOpen={isNoticeOpen} 
          onClose={() => setIsNoticeOpen(false)}
          notice={signupNotice}
        />
        <Form method="post" className={styles.form}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className={styles.input}
            required
            disabled={sending}
          />
          {actionData?.errors?.firstName && (
            <p className={styles.error}>{actionData.errors.firstName}</p>
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className={styles.input}
            required
            disabled={sending}
          />
          {actionData?.errors?.email && (
            <p className={styles.error}>{actionData.errors.email}</p>
          )}
          
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="emailConsent"
              required
              disabled={sending}
            />
            <span>  I agree to receive emails from allyforensics.com</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="betaFeedback"
              required
              disabled={sending}
            />
            <span>  I agree to provide feedback during beta testing in exchange for free access upon release</span>
          </label>

          <Turnstile
            className={styles.turnstile}
            theme="light"
          />

          <button 
            type="submit" 
            className={styles.button}
            disabled={sending}
          >
            {sending ? 'Submitting...' : 'Request Beta Access'}
          </button>
        </Form>
        
        {actionData?.success && (
          <div className={styles.success}>
            <p><h2>Thank you for signing up!</h2></p>
            <p>We&apos;ll be in touch Q2 2025</p>
          </div>
        )}
      </div>
    </div>
  );
}