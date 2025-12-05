// In frontend/app/(auth)/layout.tsx
import React from "react";
import Logo from "@/components/Logo";

// This layout will apply to all routes inside the (auth) folder
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-shop_light_pink flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Logo />
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
      
      {/* Footer */}
      <div className="p-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} WyZar. All rights reserved.
      </div>
    </div>
  );
}
