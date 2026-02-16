// frontend/components/ProductCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getImageUrl, cn } from "@/lib/utils";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";

// Define the Product type to match our API response
export interface Product {
  id: string;
  sellerId?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  images: string[];
  seller: {
    id: string;
    sellerDetails: {
      businessName: string;
    };
  } | null;
  createdAt: string;
  deliveryTime?: string;
  countryOfOrigin?: string;
  rating?: {
    average: number;
    count: number;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const router = useRouter();

  const imageUrl = getImageUrl(product.images[0]);
  const rating = product.rating?.average || (product as any).ratingAverage || 0;
  const reviewCount = product.rating?.count || (product as any).ratingCount || 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (isWishlisted) {
      toast.info(`${product.name} removed from wishlist`);
    } else {
      toast.success(`${product.name} added to wishlist`);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.id}`);
  };

  const handleImageClick = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden border border-line hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderRadius: '20px' }}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden bg-sand/30 cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={true}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.quantity < 10 && product.quantity > 0 && (
            <Badge className="bg-terracotta-light text-white text-xs rounded-full">
              Low Stock
            </Badge>
          )}
          {product.quantity === 0 && (
            <Badge variant="destructive" className="text-xs rounded-full bg-terracotta">
              Out of Stock
            </Badge>
          )}
          {new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <Badge className="bg-sage text-white text-xs rounded-full">
              New
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300",
            isWishlisted 
              ? "bg-terracotta text-white" 
              : "bg-white/90 text-brown-light hover:bg-terracotta hover:text-white shadow-md"
          )}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>

        {/* Quick Action Buttons - Show on Hover */}
        <div className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="bg-terracotta hover:bg-brown text-white shadow-lg rounded-full"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
          <Button
            onClick={handleQuickView}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white shadow-lg border-line rounded-full"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <Link 
          href={`/products?category=${product.category}`}
          className="text-xs text-sage hover:text-terracotta font-medium uppercase tracking-wide"
        >
          {product.category}
        </Link>

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-1 font-semibold text-brown line-clamp-2 hover:text-terracotta transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(rating)
                    ? "text-terracotta-light fill-terracotta-light"
                    : "text-line"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-brown-light ml-1">
            ({reviewCount})
          </span>
        </div>

        {/* Seller */}
        <p className="text-xs text-brown-light mt-2">
          By{" "}
          <span className="text-sage hover:underline cursor-pointer">
            {product.seller?.sellerDetails?.businessName || 'Unknown Seller'}
          </span>
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-terracotta">
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          {/* Mobile Add to Cart */}
          <Button
            onClick={handleAddToCart}
            size="icon"
            variant="outline"
            className="md:hidden border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Stock Status */}
        {product.quantity > 0 && product.quantity <= 5 && (
          <p className="text-xs text-terracotta-light mt-2">
            Only {product.quantity} left in stock
          </p>
        )}
      </div>
    </div>
  );
}
