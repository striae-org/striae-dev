const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dev.striae.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};

// Configuration constants
const RECAPTCHA_API_BASE = 'https://recaptchaenterprise.googleapis.com/v1';
const DEFAULT_RISK_THRESHOLD = 0.7; // Adjust based on your risk tolerance

/**
 * Create a standardized response
 */
const createResponse = (data, status = 200) => new Response(
  JSON.stringify(data), 
  { status, headers: corsHeaders }
);

/**
 * Authenticate the request
 */
async function authenticate(request, env) {
  const authKey = request.headers.get('X-Custom-Auth-Key');
  if (authKey !== env.SMS_DEFENSE_AUTH) {
    throw new Error('Unauthorized');
  }
}

/**
 * Get Google Cloud access token using service account
 */
async function getAccessToken(env) {
  // For now, we'll use API key authentication
  // In production, you might want to use service account authentication
  return env.RECAPTCHA_API_KEY;
}

/**
 * Create an assessment with Google reCAPTCHA Enterprise
 */
async function createAssessment(token, siteKey, phoneNumber, accountId, projectId, accessToken) {
  const assessmentData = {
    event: {
      token: token,
      siteKey: siteKey,
      userInfo: {
        accountId: accountId,
        userIds: [
          {
            phoneNumber: phoneNumber // Must be in E.164 format
          }
        ]
      }
    }
  };

  const response = await fetch(
    `${RECAPTCHA_API_BASE}/projects/${projectId}/assessments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assessmentData)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`reCAPTCHA API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Annotate an assessment (required for improving detection)
 */
async function annotateAssessment(assessmentId, phoneNumber, reason, annotation, projectId, accessToken) {
  const annotationData = {
    reasons: [reason], // INITIATED_TWO_FACTOR, PASSED_TWO_FACTOR, FAILED_TWO_FACTOR
    phoneAuthenticationEvent: {
      phoneNumber: phoneNumber
    }
  };

  if (annotation) {
    annotationData.annotation = annotation; // LEGITIMATE or FRAUDULENT
  }

  const response = await fetch(
    `${RECAPTCHA_API_BASE}/projects/${projectId}/assessments/${assessmentId}:annotate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(annotationData)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.warn(`Failed to annotate assessment: ${response.status} - ${error}`);
  }

  return response.ok;
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's already formatted
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already starts with +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Otherwise, assume it's already formatted correctly
  return `+${digits}`;
}

/**
 * Handle SMS fraud check request
 */
async function handleSMSFraudCheck(request, env) {
  try {
    const {
      token,
      phoneNumber,
      accountId,
      action = 'sms_verification',
      riskThreshold
    } = await request.json();

    // Validate required fields
    if (!token || !phoneNumber || !accountId) {
      return createResponse({
        error: 'Missing required fields: token, phoneNumber, accountId'
      }, 400);
    }

    // Format phone number to E.164
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Get access token
    const accessToken = await getAccessToken(env);
    
    // Create assessment
    const assessment = await createAssessment(
      token,
      env.RECAPTCHA_SITE_KEY,
      formattedPhone,
      accountId,
      env.RECAPTCHA_PROJECT_ID,
      accessToken
    );

    // Extract risk score
    const riskScore = assessment.phoneFraudAssessment?.smsTollFraudVerdict?.risk || 0;
    const threshold = riskThreshold || DEFAULT_RISK_THRESHOLD;
    const isBlocked = riskScore > threshold;

    // Log for monitoring
    console.log('SMS Fraud Check:', {
      accountId,
      phoneNumber: formattedPhone,
      action,
      riskScore,
      threshold,
      blocked: isBlocked,
      assessmentId: assessment.name
    });

    // Return decision
    const result = {
      allowed: !isBlocked,
      riskScore: riskScore,
      threshold: threshold,
      assessmentId: assessment.name,
      phoneNumber: formattedPhone,
      action: action,
      timestamp: new Date().toISOString()
    };

    return createResponse(result);

  } catch (error) {
    console.error('SMS fraud check error:', error);
    return createResponse({
      error: 'SMS fraud check failed',
      message: error.message
    }, 500);
  }
}

/**
 * Handle assessment annotation
 */
async function handleAnnotateAssessment(request, env) {
  try {
    const {
      assessmentId,
      phoneNumber,
      reason,
      annotation
    } = await request.json();

    // Validate required fields
    if (!assessmentId || !phoneNumber || !reason) {
      return createResponse({
        error: 'Missing required fields: assessmentId, phoneNumber, reason'
      }, 400);
    }

    // Format phone number to E.164
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Get access token
    const accessToken = await getAccessToken(env);
    
    // Extract assessment ID from full name if needed
    const shortAssessmentId = assessmentId.split('/').pop();
    
    // Annotate assessment
    const success = await annotateAssessment(
      shortAssessmentId,
      formattedPhone,
      reason,
      annotation,
      env.RECAPTCHA_PROJECT_ID,
      accessToken
    );

    return createResponse({
      success: success,
      assessmentId: shortAssessmentId,
      phoneNumber: formattedPhone,
      reason: reason,
      annotation: annotation
    });

  } catch (error) {
    console.error('Assessment annotation error:', error);
    return createResponse({
      error: 'Assessment annotation failed',
      message: error.message
    }, 500);
  }
}

/**
 * Main worker handler
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Authenticate request
      await authenticate(request, env);
      
      const url = new URL(request.url);
      const path = url.pathname;

      switch (path) {
        case '/check':
          if (request.method === 'POST') {
            return handleSMSFraudCheck(request, env);
          }
          break;
          
        case '/annotate':
          if (request.method === 'POST') {
            return handleAnnotateAssessment(request, env);
          }
          break;
          
        case '/health':
          return createResponse({ status: 'healthy', timestamp: new Date().toISOString() });
          
        default:
          return createResponse({ error: 'Not found' }, 404);
      }

      return createResponse({ error: 'Method not allowed' }, 405);

    } catch (error) {
      console.error('Worker error:', error);
      
      if (error.message === 'Unauthorized') {
        return createResponse({ error: 'Unauthorized' }, 401);
      }
      
      return createResponse({
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  }
};