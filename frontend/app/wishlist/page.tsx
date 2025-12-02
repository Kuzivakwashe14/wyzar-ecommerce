"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/lib/utils";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  ShoppingBag,
  Star 
} from "lucide-react";

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: typeof wishlist[0]) => {
    addToCart(product);
    // Toast is handled by CartContext
  };

  const handleRemove = (productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast.info(`${productName} removed from wishlist`);
  };

  const handleClearWishlist = () => {
    clearWishlist();
    toast.info("Wishlist cleared");
  };

  const handleAddAllToCart = () => {
    wishlist.forEach((product) => {
      if (product.quantity > 0) {
        addToCart(product);
      }
    });
    // Toasts are handled by CartContext
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shop_dark_green"></div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="text-shop_dark_green hover:bg-shop_light_pink">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="h-8 w-8 text-shop_orange fill-shop_orange" />
                My Wishlist
              </h1>
              <p className="text-gray-500">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>
          
          {wishlist.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddAllToCart}
                className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-shop_light_pink flex items-center justify-center mb-6">
                  <Heart className="h-12 w-12 text-shop_orange" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Save items you love to your wishlist. Review them anytime and easily add them to your cart.
                </p>
                <Link href="/products">
                  <Button className="bg-shop_dark_green hover:bg-shop_light_green text-white">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <Card 
                key={product._id} 
                className="group border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative aspect-square bg-shop_light_pink/30">
                  <Link href={`/products/${product._id}`}>
                    <Image
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </Link>
                  
                  {/* Remove from Wishlist */}
                  <button
                    onClick={() => handleRemove(product._id, product.name)}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Stock Status */}
                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <Link href={`/products?category=${product.category}`}>
                    <span className="text-xs text-shop_dark_green hover:text-shop_light_green font-medium uppercase tracking-wide">
                      {product.category}
                    </span>
                  </Link>

                  <Link href={`/products/${product._id}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-shop_dark_green transition-colors mt-1">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {product.rating.average?.toFixed(1) || "0"} ({product.rating.count || 0})
                      </span>
                    </div>
                  )}

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-shop_dark_green">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
                      className="bg-shop_dark_green hover:bg-shop_light_green text-white"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Stock Warning */}
                  {product.quantity > 0 && product.quantity <= 5 && (
                    <p className="text-xs text-shop_orange mt-2">
                      Only {product.quantity} left in stock
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
