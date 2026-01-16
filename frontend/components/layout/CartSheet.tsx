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
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

import { getImageUrl } from "@/lib/utils";

// Get the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CartSheet() {
  const { cartItems, itemCount, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <Sheet>
      {/* 1. The Cart Icon Button */}
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hoverEffect hover:bg-shop_dark_green/10 relative"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-shop_orange text-gray-900">
              {itemCount > 9 ? '9+' : itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      {/* 2. The Sheet Content */}
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-shop_dark_green" />
            Shopping Cart
            <span className="text-sm font-normal text-muted-foreground">
              ({itemCount} items)
            </span>
          </SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="h-24 w-24 rounded-full bg-shop_light_pink flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-shop_dark_green/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground text-center mb-6">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <SheetClose asChild>
              <Button asChild className="bg-shop_dark_green hover:bg-shop_light_green text-white">
                <Link href="/products">
                  Start Shopping
                </Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* 3. Cart Items List */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-start gap-4 py-4">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border bg-shop_light_pink/30 shrink-0">
                    <Image
                      src={getImageUrl(item.images[0])}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-1"
                      unoptimized={true}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.name}
                    </h4>
                    <p className="text-shop_dark_green font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none rounded-l-lg hover:bg-shop_light_pink"
                          onClick={() => updateQuantity(item._id, Math.max(1, item.cartQuantity - 1))}
                          disabled={item.cartQuantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">
                          {item.cartQuantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none rounded-r-lg hover:bg-shop_light_pink"
                          onClick={() => updateQuantity(item._id, Math.min(item.quantity, item.cartQuantity + 1))}
                          disabled={item.cartQuantity >= item.quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Sheet Footer */}
            <SheetFooter className="border-t pt-4 mt-auto">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-shop_light_green">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-shop_dark_green">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button 
                    asChild
                    className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white h-12"
                    size="lg"
                  >
                    <Link href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    asChild
                    variant="outline" 
                    className="w-full h-11 border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
                  >
                    <Link href="/products">
                      Continue Shopping
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
