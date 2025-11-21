// In frontend/app/(auth)/layout.tsx
import React from "react";

// This layout will apply to all routes inside the (auth) folder
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
}