import { json } from '@remix-run/cloudflare';
import type { AppLoadContext } from '@remix-run/cloudflare';

export async function action({ request, context }: { request: Request, context: AppLoadContext }) {
  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const password = formData.get('password') as string;

    if (!password) {
      return json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const accessPassword = context.cloudflare.env.AUTH_PASSWORD;
    
    if (!accessPassword) {
      console.error('AUTH_PASSWORD environment variable not set');
      return json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }
        
    if (password === accessPassword) {
      return json({ success: true });
    } else {
      return json({ success: false, error: 'Incorrect access password. Please contact support if you need access.' });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return json({ success: false, error: 'An error occurred during verification' }, { status: 500 });
  }
}
