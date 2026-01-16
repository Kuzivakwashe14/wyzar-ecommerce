"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Fire confetti on page load
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left and right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. We&apos;ve received your order and will
            process it shortly.
          </p>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Package className="w-5 h-5" />
              <span>Your order is being prepared</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full bg-shop_dark_green hover:bg-shop_dark_green/90">
              <Link href="/orders">
                View My Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
