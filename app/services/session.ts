import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "striae_session",
    secure: true,
    secrets: ["your-secret"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
  },
});

export async function createUserSession(
  user: { uid: string; email: string },
  redirectTo: string
) {
  const session = await sessionStorage.getSession();
  session.set("userId", user.uid);
  session.set("userEmail", user.email);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}