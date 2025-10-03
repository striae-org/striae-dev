import { Outlet } from "@remix-run/react";
import { AuthProvider } from "~/root";

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}