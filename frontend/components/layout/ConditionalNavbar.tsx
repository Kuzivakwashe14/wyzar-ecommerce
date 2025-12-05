"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't show navbar on admin routes or auth pages
  if (
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return null;
  }

  return <Header />;
}

