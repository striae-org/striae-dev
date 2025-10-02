/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { baseMeta } from '~/utils/meta';
import { Turnstile } from '~/components/turnstile/turnstile';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';
import freeEmailDomains from 'free-email-domains';
import { verifyTurnstileToken } from '~/utils/turnstile';
import { Form, useActionData, useNavigation, Link } from '@remix-run/react';
import { json, redirect } from '@remix-run/cloudflare';
import styles from './signup.module.css';

const MAX_NAME_LENGTH = 128;

interface ActionData {
    success?: boolean;
    errors?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      company?: string;
    };
}

// Email validation with regex and domain checking
  const validateEmailDomain = (email: string): boolean => {
    // Email regex pattern for basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // First check if email format is valid
    if (!emailRegex.test(email)) {
      return false;
    }
    
    const emailDomain = email.toLowerCase().split('@')[1];
    return !!emailDomain && !freeEmailDomains.includes(emailDomain);
  };

export const meta = () => {
  return baseMeta({
    title: 'Sign up for Striae Access',
    description:
      'Complete the form to access Striae.',
  });
};

export async function action({ request, context }: { request: Request, context: any }) {
  const formData = await request.formData();
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const company = formData.get('company') as string;
  const emailConsent = formData.get('emailConsent') === 'on';
  const codeAgreement = formData.get('codeAgreement') === 'on';
  const errors: { firstName?: string; lastName?: string; email?: string; company?: string; } = {};

  if (!firstName || firstName.length > MAX_NAME_LENGTH) {
    errors.firstName = 'Please enter your first name';
  }

  if (!lastName || lastName.length > MAX_NAME_LENGTH) {
    errors.lastName = 'Please enter your last name';
  }

  if (!email || !validateEmailDomain(email)) {
    errors.email = 'Please use a work email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed';
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
            "name": `${firstName} ${lastName}`,
            "email": email
          }
        ],
        "cc": [
          {
            "name": "Striae Admin",
            "email": "info@striae.org"
          }
        ],
        "subject": "Striae Access Registration",
        "ContentType": "HTML",
        "HTMLContent": `<html><body>
          <h2>New Striae Access Request</h2>
          <p><strong>Name:</strong> ${firstName}</p>
          <p><strong>Last Name:</strong> ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Lab/Company Name:</strong> ${company}</p>
          <p><strong>Email Consent:</strong> ${emailConsent}</p>
          <p><strong>Code Agreement:</strong> ${codeAgreement}</p>
          
          <hr style="margin: 20px 0; border: 1px solid #ccc;">
          
          <h3>Access Request Received</h3>
          <p>Your access request has been received and is being processed. You will receive an email notification once your account has been added to the access list. We encourage you to join our <a href="https://discord.gg/ESUPhTPwHx">Discord channel</a>.</p>
          
          <p><strong>Important:</strong> Subsequent logins will require a one-time access code that will be emailed to you to access the login screen. This code will be valid for one month from the date of issuance.</p>
          
          <p>Thank you for your interest in Striae!</p>
        </body></html>`,
        "PlainContent": `Striae Access Registration:

        Name: ${firstName}
        Last Name: ${lastName}
        Email: ${email}
        Lab/Company Name: ${company}
        Email Consent: ${emailConsent}
        Code Agreement: ${codeAgreement}
        
        ==========================================
        
        Access Request Received

        Your access request has been received and is being processed. You will receive an email notification once your account has been added to the access list. We encourage you to join our Discord server at https://discord.gg/ESUPhTPwHx.

        Important: Subsequent logins will require a one-time access code that will be emailed to you to access the login screen. This code will be valid for one month from the date of issuance.
        
        Thank you for your interest in Striae!`,
        "Tags": [
          "access-registration"
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
      <Link 
        to="/#top"
        viewTransition
        className={styles.logoLink}>
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
              name="codeAgreement"
              required
              disabled={sending}
            />
            <span>I have read the <a href="https://help.striae.org/striae-users-guide/getting-started/code-of-responsible-use" target="_blank" rel="noopener noreferrer">Code of Responsible Use</a> and agree to abide by its terms.</span>
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