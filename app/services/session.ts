import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("Session secret variable is required");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "striae_session",
    secure: true,
    secrets: [sessionSecret],
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

export async function setUserSession(user: { uid: string; email: string }) {
  const session = await sessionStorage.getSession();
  session.set("userId", user.uid);
  session.set("userEmail", user.email);
  
  return await sessionStorage.commitSession(session);
}

export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  
  const userId = session.get("userId");
  const userEmail = session.get("userEmail");
  
  if (!userId) return null;
  
  return { uid: userId, email: userEmail };
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}