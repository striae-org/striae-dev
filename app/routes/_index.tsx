import { auth } from '~/services/firebase';
import type { CloudflareContext, LoaderType } from '~/types/actions';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { loader as loginLoader } from './auth/login';
import { action as sidebarAction, loader as sidebarLoader } from '~/components/sidebar/sidebar';
//import { action as annotationsAction, loader as annotationsLoader } from '~/components/annotations/annotations';

export { Login as default, meta } from './auth/login'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const loaderType = searchParams.get('loaderType') as LoaderType;
  const typedContext = context as unknown as CloudflareContext;
  const currentUser = auth.currentUser;

  try {
    switch (loaderType) {
      case 'auth':
        return loginLoader({ request, context: typedContext, user: currentUser });
      case 'sidebar':
        return sidebarLoader({ request, context: typedContext, user: currentUser });
      default:
        return json({ error: 'Invalid loader type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: 'Loader failed' }, { status: 500 });
  }
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.clone().formData();
  const actionType = formData.get('actionType');
  const typedContext = context as unknown as CloudflareContext;

  try {
    switch (actionType) {
      case 'sidebar':
        return sidebarAction({ request, context: typedContext });
     // case 'annotations':
        //return annotationsAction({ request, context: typedContext });
      default:
        return json({ error: 'Invalid action type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: 'Action failed' }, { status: 500 });
  }
};