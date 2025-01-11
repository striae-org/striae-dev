import type { CloudflareContext } from '~/types/actions';
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { action as sidebarAction } from '~/components/sidebar/sidebar';
//import { action as annotationsAction } from '~/components/annotations/annotations';

export { Login as default, meta, loader } from './auth/login'

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