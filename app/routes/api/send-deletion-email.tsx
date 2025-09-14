import { json } from '@remix-run/cloudflare';

export async function action({ request, context }: { request: Request; context: any }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const requestBody = await request.json() as {
      userEmail: string;
      userName: string;
      uid: string;
      company: string;
    };
    
    const { userEmail, userName, uid, company } = requestBody;

    if (!userEmail || !uid) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Email to the user
    const userEmailResponse = await fetch('https://console.sendlayer.com/api/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.cloudflare.env.SL_API_KEY}`,
      },
      body: JSON.stringify({
        "from": {
          "name": "Striae Account Services",
          "email": "no-reply@striae.org"
        },
        "to": [
          {
            "name": userName,
            "email": userEmail
          }
        ],
        "subject": "Striae Account Deletion Confirmation",
        "ContentType": "HTML",
        "HTMLContent": `<html><body>
          <h2>Account Deletion Confirmation</h2>
          <p>Dear ${userName},</p>
          <p>This email confirms that you have requested your Striae account to be deleted.</p>
          <p><strong>Account Details:</strong></p>
          <ul>
            <li><strong>User ID:</strong> ${uid}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Company:</strong> ${company}</li>
          </ul>
          <p>All your account information and data have been permanently removed from our systems. Your login credentials will be invalidated within the next 3 business days. If you attempt to login during this period, Striae will not function correctly.</p>
          <p>If you did not request this deletion or believe this was done in error, please contact our support team immediately at info@striae.org.</p>
          <p>Thank you for using Striae.</p>
          <p>Best regards,<br>The Striae Team</p>
        </body></html>`,
        "PlainContent": `Account Deletion Confirmation

Dear ${userName},

This email confirms that your Striae account has been successfully deleted.

Account Details:
- User ID: ${uid}
- Email: ${userEmail}
- Company: ${company}

All your account information and data have been permanently removed from our systems. Your login credentials will be invalidated within the next 3 business days. If you attempt to login during this period, Striae will not function correctly.

If you did not request this deletion or believe this was done in error, please contact our support team immediately at info@striae.org.

Thank you for using Striae.

Best regards,
The Striae Team`,
        "Tags": ["account-deletion"],
        "Headers": {
          "X-Mailer": "striae.org"
        }
      }),
    });

    // Email to support
    const supportEmailResponse = await fetch('https://console.sendlayer.com/api/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.cloudflare.env.SL_API_KEY}`,
      },
      body: JSON.stringify({
        "from": {
          "name": "Striae Account Deletion Request",
          "email": "no-reply@striae.org"
        },
        "to": [
          {
            "name": "Striae Support",
            "email": "info@striae.org"
          }
        ],
        "subject": "Account Deletion Request",
        "ContentType": "HTML",
        "HTMLContent": `<html><body>
          <h2>Account Deletion Notification</h2>
          <p>A user has requested to delete their Striae account.</p>
          <p><strong>Account Details:</strong></p>
          <ul>
            <li><strong>User ID:</strong> ${uid}</li>
            <li><strong>Name:</strong> ${userName}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Company:</strong> ${company}</li>
            <li><strong>Deletion Time:</strong> ${new Date().toISOString()}</li>
          </ul>
          <p>The user has been sent a confirmation email.</p>
        </body></html>`,
        "PlainContent": `Account Deletion Request

A user has requested to delete their Striae account.

Deleted Account Details:
- User ID: ${uid}
- Name: ${userName}
- Email: ${userEmail}
- Company: ${company}
- Deletion Time: ${new Date().toISOString()}

The user has been sent a confirmation email.`,
        "Tags": ["account-deletion", "admin-notification"],
        "Headers": {
          "X-Mailer": "striae.org"
        }
      }),
    });

    if (!userEmailResponse.ok || !supportEmailResponse.ok) {
      throw new Error('Failed to send deletion emails');
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Email sending error:', error);
    return json({ error: 'Failed to send emails' }, { status: 500 });
  }
}