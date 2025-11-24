// In frontend/components/layout/CartSheet.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2 } from "lucide-react";

// Get the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CartSheet() {
  const { cartItems, itemCount, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <Sheet>
      {/* 1. The Cart Icon Button */}
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      {/* 2. The Sheet Content */}
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-gray-300" />
            <p className="mt-4 text-gray-500">Your cart is empty.</p>
          </div>
        ) : (
          <>
            {/* 3. Cart Items List */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center space-x-4 py-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <Image
                      src={`${API_BASE_URL}/${item.images[0].replace(/\\/g, '/')}`}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center mt-2">
                      <Input
                        type="number"
                        min="1"
                        max={item.quantity} // Max stock
                        value={item.cartQuantity}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                        className="h-8 w-16"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 4. Sheet Footer */}
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <SheetClose asChild>
                  <Link href="/checkout" passHref>
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}