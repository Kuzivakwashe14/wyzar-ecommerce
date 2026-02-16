"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { api, useAuth } from "@/context/AuthContent";
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
  Package,
  Truck,
  Shield,
  Star,
  MinusIcon,
  PlusIcon,
  MapPin,
  Clock,
  MessageCircle,
  Copy
} from "lucide-react";

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
  const { isAuthenticated, login } = useAuth();

  const isWishlisted = product ? isInWishlist(product.id) : false;

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
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!", { icon: <Copy className="h-4 w-4" /> });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
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
        const allProductsResponse = await api.get("/products");
        const related = allProductsResponse.data
          .filter((p: Product) => p.category === response.data.category && p.id !== response.data.id)
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
    if (!product) { toast.error("Product not available"); return; }
    if (!isAuthenticated) { toast.error("Please login to message the seller"); login(); return; }
    try {
      setStartingChat(true);
      const sellerId = product.seller?.id || (product as any).sellerId;
      if (!sellerId) { toast.error("Seller information not available"); return; }
      await api.post('/messages/send', {
        receiverId: sellerId,
        productId: product.id,
        message: `Hi, I'm interested in ${product.name}. Is this still available?`
      });
      toast.success("Message sent!");
      router.push('/messages');
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast.error(error.response?.data?.msg || 'Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  const incrementQuantity = () => { if (product && quantity < product.quantity) setQuantity(quantity + 1); };
  const decrementQuantity = () => { if (quantity > 1) setQuantity(quantity - 1); };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-sand rounded-2xl animate-pulse" style={{ borderRadius: '20px' }} />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-sand rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-sand rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-sand rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-sand rounded w-1/4 animate-pulse" />
              <div className="h-32 bg-sand rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-line p-12" style={{ borderRadius: '20px' }}>
            <Package className="mx-auto h-16 w-16 text-brown-light/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-brown">Product Not Found</h3>
            <p className="text-brown-light mb-6">{error || "The product you're looking for doesn't exist."}</p>
            <Button onClick={() => router.push("/products")} className="bg-terracotta hover:bg-brown text-white rounded-full">Browse Products</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="border-b border-line bg-white">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-brown-light">
            <Link href="/" className="hover:text-terracotta transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-terracotta transition-colors">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/products?category=${product.category}`} className="hover:text-terracotta transition-colors">
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-terracotta font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-line" style={{ borderRadius: '20px' }}>
              <div className="relative w-full aspect-auto min-h-[300px] flex items-center justify-center bg-sand/30">
                <Image
                  src={getImageUrl(product.images[selectedImage])}
                  alt={`${product.name} - Image ${selectedImage + 1}`}
                  width={800}
                  height={800}
                  style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  unoptimized={true}
                  priority
                  className="rounded-2xl"
                />
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {product.images.map((imagePath, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index
                    ? 'border-terracotta ring-2 ring-terracotta/20'
                    : 'border-line hover:border-terracotta/50'
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
            <div className="bg-white rounded-2xl border border-line p-6" style={{ borderRadius: '20px' }}>
              <h3 className="text-lg font-semibold text-brown mb-4">Product Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brown-light">Category</p>
                    <p className="font-medium text-brown">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brown-light">Stock</p>
                    <p className={`font-medium ${product.quantity > 0 ? 'text-sage' : 'text-terracotta'}`}>
                      {product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}
                    </p>
                  </div>
                  {product.deliveryTime && (
                    <div>
                      <p className="text-sm text-brown-light">Delivery Time</p>
                      <p className="font-medium text-brown flex items-center gap-1">
                        <Clock className="h-4 w-4 text-terracotta" />
                        {product.deliveryTime}
                      </p>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div>
                      <p className="text-sm text-brown-light">Origin</p>
                      <p className="font-medium text-brown flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-sage" />
                        {product.countryOfOrigin}
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="bg-line" />

                <div>
                  <h4 className="font-semibold mb-2 text-brown">Description</h4>
                  <p className="text-brown-light whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-line p-6 space-y-4" style={{ borderRadius: '20px' }}>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-brown">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-sage/10 text-sage hover:bg-sage/20 rounded-full">{product.category}</Badge>
                  {product.rating && product.rating.count > 0 ? (
                    <div className="flex items-center gap-1 text-sm text-brown-light">
                      <Star className="h-4 w-4 fill-terracotta-light text-terracotta-light" />
                      <span>{product.rating.average.toFixed(1)}</span>
                      <span className="text-brown-light/60">
                        ({product.rating.count} review{product.rating.count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-brown-light/60">
                      <Star className="h-4 w-4 text-line" />
                      <span>No reviews yet</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-line" />

              <div>
                <p className="text-sm text-brown-light mb-1">Price</p>
                <p className="text-4xl font-bold text-terracotta">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              {/* Quantity Selector */}
              {product.quantity > 0 && (
                <>
                  <Separator className="bg-line" />
                  <div>
                    <p className="text-sm font-medium mb-2 text-brown">Quantity</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="border-line text-brown hover:bg-terracotta hover:text-white hover:border-terracotta rounded-xl"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-semibold w-12 text-center text-brown">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.quantity}
                        className="border-line text-brown hover:bg-terracotta hover:text-white hover:border-terracotta rounded-xl"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-brown-light">
                        {product.quantity} available
                      </span>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-line" />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full text-lg bg-terracotta hover:bg-brown text-white rounded-full"
                  disabled={product.quantity === 0}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="lg" onClick={handleAskSeller} disabled={startingChat} className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask Seller
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleWishlist}
                    className={isWishlisted 
                      ? "bg-terracotta text-white border-terracotta hover:bg-terracotta/90 rounded-full" 
                      : "border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full"
                    }
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                    {isWishlisted ? "Wishlisted" : "Wishlist"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleShare}
                    className="border-line hover:bg-sand rounded-full"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl border border-line p-4 space-y-3" style={{ borderRadius: '20px' }}>
              <div className="flex items-center gap-3 text-sm text-brown">
                <Shield className="h-5 w-5 text-sage" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brown">
                <Truck className="h-5 w-5 text-terracotta" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brown">
                <Package className="h-5 w-5 text-brown" />
                <span>7 Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product && product.id && (
          <div className="mt-16">
            <ProductReviews productId={product.id} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Explore More</span>
                <h2 className="text-2xl md:text-3xl font-bold text-brown">Related Products</h2>
              </div>
              <Link href={`/products?category=${product.category}`}>
                <Button variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
