"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
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

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: typeof wishlist[0]) => {
    addToCart(product);
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
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream py-8">
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="text-brown hover:bg-sand">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-brown flex items-center gap-2">
                <Heart className="h-8 w-8 text-terracotta fill-terracotta" />
                My Wishlist
              </h1>
              <p className="text-brown-light">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>
          
          {wishlist.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddAllToCart}
                className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl border border-line p-16 text-center" style={{ borderRadius: '20px' }}>
            <div className="mx-auto w-24 h-24 rounded-full bg-sand flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-terracotta" />
            </div>
            <h2 className="text-xl font-semibold text-brown mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-brown-light mb-6 max-w-md mx-auto">
              Save items you love to your wishlist. Review them anytime and easily add them to your cart.
            </p>
            <Link href="/products">
              <Button className="bg-terracotta hover:bg-brown text-white rounded-full px-6">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div 
                key={product.id} 
                className="group bg-white rounded-2xl border border-line hover:shadow-md transition-all overflow-hidden"
                style={{ borderRadius: '20px' }}
              >
                <div className="relative aspect-square bg-sand/30">
                  <Link href={`/products/${product.id}`}>
                    <Image
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </Link>
                  
                  <button
                    onClick={() => handleRemove(product.id, product.name)}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-brown/50 flex items-center justify-center">
                      <span className="bg-terracotta text-white px-4 py-2 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Link href={`/products?category=${product.category}`}>
                    <span className="text-xs text-sage hover:text-terracotta font-medium uppercase tracking-wide">
                      {product.category}
                    </span>
                  </Link>

                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-brown line-clamp-2 hover:text-terracotta transition-colors mt-1">
                      {product.name}
                    </h3>
                  </Link>

                  {product.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 text-terracotta-light fill-terracotta-light" />
                      <span className="text-sm text-brown-light">
                        {product.rating.average?.toFixed(1) || "0"} ({product.rating.count || 0})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-terracotta">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
                      className="bg-terracotta hover:bg-brown text-white rounded-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {product.quantity > 0 && product.quantity <= 5 && (
                    <p className="text-xs text-terracotta-light mt-2">
                      Only {product.quantity} left in stock
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
