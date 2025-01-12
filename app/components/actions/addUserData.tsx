import { json } from '@remix-run/cloudflare';
import paths from '~/config.json';
import type { CloudflareContext, UserActionData, UserData } from '~/types/actions';

const WORKER_URL = paths.data_worker_url;

export const action = async ({ request, context }: { request: Request; context: CloudflareContext}) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent !== 'addUser') {
    return json<UserActionData>({ 
      success: false, 
      error: 'Invalid intent' 
    }, { status: 400 });
  }

  const userData: UserData = {
    uid: formData.get('uid') as string,
    email: formData.get('email') as string,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    permitted: formData.get('permitted') === 'true',
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(`${WORKER_URL}/${userData.uid}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create user data: ${response.statusText}`);
    }

    return json<UserActionData>({ success: true, data: userData });
  } catch (error) {
    console.error('Error creating user data:', error);
    return json<UserActionData>({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};