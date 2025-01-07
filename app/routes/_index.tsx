import type { MetaFunction } from "@remix-run/cloudflare";
import Login from "./login-test";

export const meta: MetaFunction = () => {
  return [
    { title: "Login - Striae" },
    { name: "description", content: "Login to your Striae account" },
  ];
};

export default function Index() {
  return <Login />;
}