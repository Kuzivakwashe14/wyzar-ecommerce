// frontend/components/layout/CartSheet.tsx
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

export default function CartSheet() {
  const { cartItems, itemCount, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hoverEffect hover:bg-sand relative text-brown"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-terracotta text-white">
              {itemCount > 9 ? '9+' : itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col w-full sm:max-w-md bg-cream border-line">
        <SheetHeader className="border-b border-line pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl text-brown">
            <ShoppingBag className="h-5 w-5 text-terracotta" />
            Shopping Cart
            <span className="text-sm font-normal text-brown-light">
              ({itemCount} items)
            </span>
          </SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="h-24 w-24 rounded-full bg-sand flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-brown-light/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-brown">Your cart is empty</h3>
            <p className="text-brown-light text-center mb-6">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <SheetClose asChild>
              <Button asChild className="bg-terracotta hover:bg-terracotta-light text-white rounded-full px-6">
                <Link href="/products">
                  Start Shopping
                </Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y divide-line">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-4">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-line bg-sand/30 shrink-0">
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
                    <h4 className="font-medium text-sm line-clamp-2 mb-1 text-brown">
                      {item.name}
                    </h4>
                    <p className="text-terracotta font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-line rounded-full overflow-hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none hover:bg-sand"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.cartQuantity - 1))}
                          disabled={item.cartQuantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium text-brown">
                          {item.cartQuantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none hover:bg-sand"
                          onClick={() => updateQuantity(item.id, Math.min(item.quantity, item.cartQuantity + 1))}
                          disabled={item.cartQuantity >= item.quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-terracotta hover:text-terracotta hover:bg-terracotta/10"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sheet Footer */}
            <SheetFooter className="border-t border-line pt-4 mt-auto">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-light">Subtotal</span>
                    <span className="text-brown">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-light">Shipping</span>
                    <span className="text-sage">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-line">
                    <span className="text-brown">Total</span>
                    <span className="text-terracotta">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button 
                    asChild
                    className="w-full bg-terracotta hover:bg-brown text-white h-12 rounded-full"
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
                    className="w-full h-11 border-brown text-brown hover:bg-brown hover:text-cream rounded-full"
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
