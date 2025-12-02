"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Don't show footer on admin routes, auth routes, messages, or checkout
  const hiddenRoutes = ['/admin', '/login', '/sign-up', '/messages', '/checkout'];
  
  if (hiddenRoutes.some(route => pathname?.startsWith(route))) {
    return null;
  }

  return <Footer />;
}
