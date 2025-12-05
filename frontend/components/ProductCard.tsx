// In frontend/components/ProductCard.tsx
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
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  images: string[];
  seller: {
    _id: string;
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
  const rating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const isWishlisted = isInWishlist(product._id);

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
    router.push(`/products/${product._id}`);
  };

  const handleImageClick = () => {
    router.push(`/products/${product._id}`);
  };

  return (
    <div 
      className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden bg-shop_light_pink/30 cursor-pointer"
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
            <Badge className="bg-shop_orange text-gray-900 text-xs">
              Low Stock
            </Badge>
          )}
          {product.quantity === 0 && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
          {/* Check if product is new (created within last 7 days) */}
          {new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <Badge className="bg-shop_light_green text-gray-900 text-xs">
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
              ? "bg-red-500 text-gray-900" 
              : "bg-white/90 text-gray-600 hover:bg-red-500 hover:text-gray-900 shadow-md"
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
            className="bg-shop_dark_green hover:bg-shop_light_green text-gray-900 shadow-lg"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
          <Button
            onClick={handleQuickView}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white shadow-lg"
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
          className="text-xs text-shop_dark_green hover:text-shop_light_green font-medium uppercase tracking-wide"
        >
          {product.category}
        </Link>

        {/* Product Name */}
        <Link href={`/products/${product._id}`}>
          <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2 hover:text-shop_dark_green transition-colors">
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
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-1">
            ({reviewCount})
          </span>
        </div>

        {/* Seller */}
        <p className="text-xs text-gray-500 mt-2">
          By{" "}
          <span className="text-shop_dark_green hover:underline cursor-pointer">
            {product.seller?.sellerDetails?.businessName || 'Unknown Seller'}
          </span>
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-shop_dark_green">
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          {/* Mobile Add to Cart */}
          <Button
            onClick={handleAddToCart}
            size="icon"
            variant="outline"
            className="md:hidden border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-gray-900"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Stock Status */}
        {product.quantity > 0 && product.quantity <= 5 && (
          <p className="text-xs text-shop_orange mt-2">
            Only {product.quantity} left in stock
          </p>
        )}
      </div>
    </div>
  );
}
