"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't show navbar on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Header />;
}

