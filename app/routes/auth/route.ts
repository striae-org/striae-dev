import { LoaderFunction, redirect } from "@remix-run/cloudflare";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const uid = url.searchParams.get('uid');
  
  if (path === '/auth/interstitial' && !uid) {
    return redirect('/auth/login');
  }
  
  return null;
};