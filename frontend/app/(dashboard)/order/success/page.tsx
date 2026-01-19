// In frontend/app/(dashboard)/order/success/page.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContent";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// This page doesn't verify the payment, it just says "thank you".
// The backend callback does the real verification.
// We'll show a link to their "My Orders" page.

export default function OrderSuccessPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }
  
  return (
    <div className="container mx-auto max-w-2xl py-24 text-center">
      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
      
      <h1 className="text-3xl font-bold mb-4">
        Thank you for your order, {user?.email}!
      </h1>
      
      <p className="text-gray-600 mb-8">
        Your payment is being processed by Paynow. You will receive a confirmation
        email shortly. You can check the status of your order in your account.
      </p>

      <div className="flex justify-center gap-4">
        <Link href="/products" passHref>
          <Button variant="outline">Continue Shopping</Button>
        </Link>
        <Link href="/my-orders" passHref>
          <Button>View My Orders</Button>
        </Link>
      </div>
    </div>
  );
}
