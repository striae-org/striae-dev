import Login, { meta as loginMeta } from "./auth/login";

export default function Index() {
  return <Login />;
}

export { loginMeta as meta };