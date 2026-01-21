"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "./Header";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show navbar on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return null;
  }

  return <Header />;
}

