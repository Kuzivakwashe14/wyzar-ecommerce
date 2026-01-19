"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/context/AuthContent";
import { Product } from "@/components/ProductCard";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Separator } from "@/components/ui/separator";
import ProductReviews from "@/components/ProductReviews";
import { getImageUrl } from "@/lib/utils";
import {
  ChevronRight,
  ShoppingCart,
  Heart,
  Share2,
  Store,
  Package,
  Truck,
  Shield,
  Star,
  MinusIcon,
  PlusIcon,
  MapPin,
  Clock,
  MessageCircle,
  Check,
  Copy
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [startingChat, setStartingChat] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Check if product is in wishlist
  const isWishlisted = product ? isInWishlist(product._id) : false;

  const handleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
    if (isWishlisted) {
      toast.info(`${product.name} removed from wishlist`);
    } else {
      toast.success(`${product.name} added to wishlist`);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on WyZar!`,
      url: window.location.href,
    };

    try {
      // Try native Web Share API first (works on mobile and some browsers)
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!", {
          icon: <Copy className="h-4 w-4" />,
        });
      }
    } catch (error) {
      // If share was cancelled, don't show error
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to share. Please copy the URL manually.");
      }
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);

        // Fetch related products (same category)
        const allProductsResponse = await api.get("/products");
        const related = allProductsResponse.data
          .filter((p: Product) =>
            p.category === response.data.category && p._id !== response.data._id
          )
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
  };

  const handleAskSeller = async () => {
    if (!product || !product.seller) return;

    try {
      setStartingChat(true);

      // Create or get conversation
      const response = await api.post('/messages/send', {
        receiverId: product.seller._id,
        productId: product._id,
        message: `Hi, I'm interested in ${product.name}. Is this still available?`
      });

      // Redirect to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setStartingChat(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Card className="max-w-md mx-auto border-gray-200">
          <CardContent className="p-12">
            <Package className="mx-auto h-16 w-16 text-shop_dark_green/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-shop_dark_green">Product Not Found</h3>
            <p className="text-gray-600 mb-6">{error || "The product you're looking for doesn't exist."}</p>
            <Button onClick={() => router.push("/products")} className="bg-shop_dark_green hover:bg-shop_light_green">Browse Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-shop_dark_green transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-shop_dark_green transition-colors">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/products?category=${product.category}`} className="hover:text-shop_dark_green transition-colors">
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-shop_dark_green font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1 space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden border-gray-200">
              <CardContent className="p-0">
                <div className="relative w-full aspect-auto min-h-[300px] flex items-center justify-center bg-gray-100">
                  <Image
                    src={getImageUrl(product.images[selectedImage])}
                    alt={`${product.name} - Image ${selectedImage + 1}`}
                    width={800}
                    height={800}
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    unoptimized={true}
                    priority
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {product.images.map((imagePath, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                    ? 'border-shop_dark_green ring-2 ring-shop_dark_green/20'
                    : 'border-gray-200 hover:border-shop_light_green'
                    }`}
                >
                  <Image
                    src={getImageUrl(imagePath)}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized={true}
                  />
                </button>
              ))}
            </div>

            {/* Product Details Card */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-shop_dark_green">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className={`font-medium ${product.quantity > 0 ? 'text-shop_light_green' : 'text-red-600'}`}>
                      {product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}
                    </p>
                  </div>
                  {product.deliveryTime && (
                    <div>
                      <p className="text-sm text-gray-500">Delivery Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4 text-shop_orange" />
                        {product.deliveryTime}
                      </p>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div>
                      <p className="text-sm text-gray-500">Origin</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-shop_dark_green" />
                        {product.countryOfOrigin}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 text-shop_dark_green">Description</h4>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Product Title & Price Card */}
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 text-shop_dark_green">{product.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-shop_dark_green/10 text-shop_dark_green hover:bg-shop_dark_green/20">{product.category}</Badge>
                    {product.rating && product.rating.count > 0 ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-shop_orange text-shop_orange" />
                        <span>{product.rating.average.toFixed(1)}</span>
                        <span className="text-gray-500">
                          ({product.rating.count} review{product.rating.count !== 1 ? 's' : ''})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="h-4 w-4 text-gray-300" />
                        <span>No reviews yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-1">Price</p>
                  <p className="text-4xl font-bold text-shop_orange">
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity Selector */}
                {product.quantity > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Quantity</p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={incrementQuantity}
                          disabled={quantity >= product.quantity}
                          className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-500">
                          {product.quantity} available
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full text-lg bg-shop_dark_green hover:bg-shop_light_green text-white"
                    disabled={product.quantity === 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="lg" onClick={handleAskSeller} disabled={startingChat} className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask Seller
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleWishlist}
                      className={isWishlisted 
                        ? "bg-shop_orange text-white border-shop_orange hover:bg-shop_orange/90" 
                        : "border-shop_orange text-shop_orange hover:bg-shop_orange hover:text-white"
                      }
                    >
                      <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                      {isWishlisted ? "Wishlisted" : "Wishlist"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleShare}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Trust Badges */}
            <Card className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-shop_light_green" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-5 w-5 text-shop_dark_green" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Package className="h-5 w-5 text-shop_orange" />
                  <span>7 Day Returns</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={product._id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-shop_dark_green">Related Products</h2>
              <Link href={`/products?category=${product.category}`}>
                <Button variant="outline" className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
