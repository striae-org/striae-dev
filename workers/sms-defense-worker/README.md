# SMS Defense Worker

A Cloudflare Worker that provides SMS fraud detection using Google reCAPTCHA Enterprise's SMS Defense feature.

## Overview

This worker integrates with Google reCAPTCHA Enterprise to assess the risk of SMS-based fraud for phone numbers used in authentication flows. It helps prevent SMS toll fraud and other SMS-based attacks.

## Features

- **Fraud Risk Assessment**: Analyzes phone numbers for fraud risk using Google's machine learning models
- **Real-time Protection**: Provides immediate risk scores for SMS verification attempts
- **Assessment Annotation**: Improves model accuracy by providing feedback on verification outcomes
- **Phone Number Formatting**: Automatically formats phone numbers to E.164 standard
- **CORS Support**: Configured for secure cross-origin requests from the Striae frontend

## API Endpoints

### POST /check
Performs SMS fraud risk assessment for a phone number.

**Request Body:**
```json
{
  "token": "reCAPTCHA_token_from_frontend",
  "phoneNumber": "+15551234567",
  "accountId": "user_account_id",
  "action": "sms_verification",
  "riskThreshold": 0.7
}
```

**Response:**
```json
{
  "allowed": true,
  "riskScore": 0.3,
  "threshold": 0.7,
  "assessmentId": "abc123",
  "phoneNumber": "+15551234567",
  "action": "sms_verification",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /annotate
Provides feedback to improve fraud detection accuracy.

**Request Body:**
```json
{
  "assessmentId": "abc123",
  "phoneNumber": "+15551234567",
  "reason": "PASSED_TWO_FACTOR",
  "annotation": "LEGITIMATE"
}
```

**Annotation Reasons:**
- `INITIATED_TWO_FACTOR`: SMS verification was initiated
- `PASSED_TWO_FACTOR`: User successfully verified SMS code
- `FAILED_TWO_FACTOR`: User failed SMS verification

**Annotation Types:**
- `LEGITIMATE`: Genuine user interaction
- `FRAUDULENT`: Confirmed fraudulent activity

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration

The worker requires the following environment variables:

- `SMS_DEFENSE_AUTH`: Authentication key for worker access
- `RECAPTCHA_API_KEY`: Google Cloud API key with reCAPTCHA Enterprise access
- `RECAPTCHA_SITE_KEY`: reCAPTCHA Enterprise site key
- `RECAPTCHA_PROJECT_ID`: Google Cloud project ID

## Phone Number Format

The worker automatically converts phone numbers to E.164 format:
- `5551234567` → `+15551234567`
- `(555) 123-4567` → `+15551234567`
- `+15551234567` → `+15551234567` (no change)

## Risk Threshold

The default risk threshold is 0.7 (70%). Phone numbers with risk scores above this threshold will be blocked. You can customize the threshold per request or adjust the default in the worker code.

## Integration Example

```javascript
// Frontend integration
const response = await fetch('https://sms-defense.dev.striae.org/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Auth-Key': 'your-auth-key'
  },
  body: JSON.stringify({
    token: recaptchaToken,
    phoneNumber: userPhoneNumber,
    accountId: userAccountId,
    action: 'sms_verification'
  })
});

const result = await response.json();

if (result.allowed) {
  // Proceed with SMS verification
  await sendSMSCode();
} else {
  // Block SMS sending due to fraud risk
  showErrorMessage('Phone number verification unavailable');
}
```

## Deployment

```bash
# Install dependencies
npm install

# Deploy to Cloudflare
npm run deploy

# Development
npm run dev
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Security Considerations

- All requests require authentication via `X-Custom-Auth-Key` header
- CORS is restricted to the Striae frontend domain
- Phone numbers are logged for monitoring but should be handled according to privacy policies
- Risk scores and assessment IDs are logged for debugging and monitoring

## Monitoring

The worker logs the following information for each assessment:
- Account ID
- Phone number (formatted)
- Action type
- Risk score
- Threshold
- Block decision
- Assessment ID

This data can be used for monitoring fraud patterns and adjusting risk thresholds.