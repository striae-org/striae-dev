/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { baseMeta } from '~/utils/meta';
import { Turnstile } from '~/components/turnstile/turnstile';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';
import { verifyTurnstileToken } from '~/utils/turnstile';
import { Form, useActionData, useNavigation, Link } from '@remix-run/react';
import { json, redirect } from '@remix-run/cloudflare';
import styles from './signup.module.css';

const MAX_NAME_LENGTH = 128;
const MAX_EMAIL_LENGTH = 512;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'live.com',
  'msn.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'yahoo.com.au',
  'googlemail.com',
  'protonmail.com',
  'tutanota.com',
  'yandex.com',
  'mail.com',
  'ymail.com',
  'gmx.com',
  'fastmail.com'
];

interface ActionData {
    success?: boolean;
    errors?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      company?: string;
    };
}

export const meta = () => {
  return baseMeta({
    title: 'Sign up for Striae Access',
    description:
      'Complete the form to register Striae access.',
  });
};

export async function action({ request, context }: { request: Request, context: any }) {
  const formData = await request.formData();
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const company = formData.get('company') as string;
  const emailConsent = formData.get('emailConsent') === 'on';
  const feedback = formData.get('feedback') === 'on';
  const errors: { firstName?: string; lastName?: string; email?: string; company?: string; } = {};

  if (!firstName || firstName.length > MAX_NAME_LENGTH) {
    errors.firstName = 'Please enter your first name';
  }

  if (!lastName || lastName.length > MAX_NAME_LENGTH) {
    errors.lastName = 'Please enter your last name';
  }

  if (!email || !EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    errors.email = 'Please enter a valid work email address';
  } else {    
    const emailDomain = email.toLowerCase().split('@')[1];
    if (PERSONAL_EMAIL_DOMAINS.includes(emailDomain)) {
      errors.email = 'Please use a work email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed';
    }
  }

  if (!company || company.length > MAX_NAME_LENGTH) {
    errors.company = 'Please enter your lab/company name';
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
          "name": "Striae Access Registration",
          "email": "no-reply@striae.org"
        },
        "to": [
          {
            "name": "Striae",
            "email": "info@striae.org"
          },
          {
            "name": `${firstName} ${lastName}`,
            "email": email
          }
        ],
        "subject": "New Striae Registration",
        "ContentType": "HTML",
        "HTMLContent": `<html><body>
          <h2>New Striae Access Request</h2>
          <p><strong>Name:</strong> ${firstName}</p>
          <p><strong>Last Name:</strong> ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Lab/Company Name:</strong> ${company}</p>
          <p><strong>Email Consent:</strong> ${emailConsent}</p>
          <p><strong>Registration Agreement:</strong> ${feedback}</p>
          <p><strong>Access Password:</strong> ${context.cloudflare.env.AUTH_PASSWORD}</p>
        </body></html>`,
        "PlainContent": `New Striae Registration:

        Name: ${firstName}
        Last Name: ${lastName}
        Email: ${email}
        Lab/Company Name: ${company}
        Email Consent: ${emailConsent}
        Registration Agreement: ${feedback}
        Access Password: ${context.cloudflare.env.AUTH_PASSWORD}`,
        "Tags": [
          "access-signup"
        ],
        "Headers": {
          "X-Mailer": "striae.org"
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return redirect('/auth');
  } catch (error) {
    console.error('Error:', error);
    return json({ errors: { email: 'Failed to submit. Please try again.' } }, { status: 500 });
  }
}


export const Signup = () => {
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [hasReadNotice, setHasReadNotice] = useState(false);
  const actionData = useActionData<ActionData>();
  const { state } = useNavigation();
  const sending = state === 'submitting';

  const handleNoticeClose = () => {
    setHasReadNotice(true);
    setIsNoticeOpen(false);
  };

  const signupNotice = {
    title: 'Before You Register',
    content: <NoticeText />,
    buttonText: 'I Have Read and Understand'
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
  <div className={styles.logo} />
</Link>      
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Register for Striae Access</h1>
         <button 
          type="button"
          onClick={() => setIsNoticeOpen(true)}
          className={styles.noticeButton}
        >
          Read before registering
        </button>
        <Notice 
        isOpen={isNoticeOpen} 
        onClose={handleNoticeClose}
        notice={signupNotice}
      />
      <Form method="post" className={styles.form}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            autoComplete="given-name"
            className={styles.input}            
            disabled={sending}
          />
          {actionData?.errors?.firstName && (
            <p className={styles.error}>{actionData.errors.firstName}</p>
          )}
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            autoComplete="family-name"
            className={styles.input}            
            disabled={sending}
          />
          {actionData?.errors?.lastName && (
            <p className={styles.error}>{actionData.errors.lastName}</p>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            className={styles.input}            
            disabled={sending}
          />
          {actionData?.errors?.email && (
            <p className={styles.error}>{actionData.errors.email}</p>
          )}          
          <input
            type="text"
            name="company"
            placeholder="Laboratory/Company Name"
            autoComplete="organization"
            className={styles.input}            
            disabled={sending}            
          />
          {actionData?.errors?.company && (
            <p className={styles.error}>{actionData.errors.company}</p>
          )}
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="emailConsent"
              required
              disabled={sending}
            />
            <span>I agree to receive emails from striae.org</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="feedback"
              required
              disabled={sending}
            />
            <span>I have read the notice and understand Striae is intended for professional use only. Additionally, I understand that I may need to resubmit this form to receive a new access password on a semi-annual basis.</span>
          </label>

          <Turnstile
            className={styles.turnstile}
            theme="light"
          />
          <button 
          type="submit"                     
          className={`${styles.button} ${!hasReadNotice ? styles.buttonDisabled : ''}`}          
          disabled={sending || !hasReadNotice}          
          title={!hasReadNotice ? 'Please read the notice first' : undefined}
        >
          {!hasReadNotice 
            ? 'Please read the notice first'
            : sending 
              ? 'Submitting...' 
              : 'Register Now'}
        </button>
      </Form>
      </div>
    </div>
  );
}