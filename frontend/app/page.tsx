"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, useAuth } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  TruckIcon,
  ShieldCheck,
  CreditCard,
  Headphones,
  Star,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// Featured categories with images
const categories = [
  { 
    name: "Electronics", 
    href: "/products?category=Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80",
    description: "Latest gadgets & devices"
  },
  { 
    name: "Fashion", 
    href: "/products?category=Fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
    description: "Trendy styles for all"
  },
  { 
    name: "Home & Living", 
    href: "/products?category=Home",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
    description: "Beautify your space"
  },
  { 
    name: "Mobile & Accessories", 
    href: "/products?category=Mobile",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
    description: "Phones & accessories"
  },
  { 
    name: "Beauty & Health", 
    href: "/products?category=Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=400&q=80",
    description: "Skincare & wellness"
  },
  { 
    name: "Sports & Outdoors", 
    href: "/products?category=Sports",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
    description: "Active gear & equipment"
  },
  { 
    name: "Books & Media", 
    href: "/products?category=Books",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80",
    description: "Read, listen & watch"
  },
  { 
    name: "Toys & Games", 
    href: "/products?category=Toys",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80",
    description: "Fun for all ages"
  },
];

// Trust features
const features = [
  {
    icon: TruckIcon,
    title: "Free Delivery",
    description: "On orders over $50"
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    description: "100% protected payments"
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated assistance"
  },
];

export default function HomePage() {
  const { isAuthenticated, user, login } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/products");
        setProducts(response.data.slice(0, 8));
        setFeaturedProducts(response.data.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Banner Section */}
      <section className="relative bg-shop_light_pink overflow-hidden">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 py-12 md:py-20">
            {/* Hero Content */}
            <div className="flex flex-col justify-center space-y-6 z-10">
              <Badge className="w-fit bg-shop_orange/10 text-shop_orange border-shop_orange/20 hover:bg-shop_orange/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Zimbabwe&apos;s Premier Marketplace
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Shop Smart,
                <br />
                <span className="text-shop_dark_green">Live Better</span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-lg">
                Discover thousands of products from trusted local and international sellers. 
                Quality guaranteed, delivered right to your doorstep.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button 
                    size="lg" 
                    className="bg-shop_dark_green hover:bg-shop_light_green text-white px-8 h-12"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Shop Now
                  </Button>
                </Link>
                {!user?.isSeller && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        login();
                      } else {
                        router.push("/become-a-seller");
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white px-8 h-12"
                  >
                    Start Selling
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-shop_dark_green">10K+</div>
                  <div className="text-sm text-gray-500">Products</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-shop_dark_green">5K+</div>
                  <div className="text-sm text-gray-500">Happy Customers</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-shop_dark_green">500+</div>
                  <div className="text-sm text-gray-500">Sellers</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="relative w-full h-[400px] lg:h-[500px]">
                <div className="absolute inset-0 bg-shop_dark_green/10 rounded-full blur-3xl" />
                <Image
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
                  alt="Shopping illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Floating Elements */}
              <div className="absolute top-10 right-10 bg-white rounded-lg p-3 shadow-lg animate-bounce-slow z-20">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-shop_light_green/20 flex items-center justify-center">
                    <TruckIcon className="h-5 w-5 text-shop_light_green" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Free Shipping</p>
                    <p className="text-sm font-semibold">Orders $50+</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-20 left-0 bg-white rounded-lg p-3 shadow-lg animate-bounce-slow z-20" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-shop_orange/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-shop_orange fill-shop_orange" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rated</p>
                    <p className="text-sm font-semibold">4.9/5 Stars</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b py-6">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 group select-none">
                <div className="h-12 w-12 rounded-full bg-shop_light_pink flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                  <feature.icon className="h-6 w-6 text-shop_dark_green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Shop by Category
              </h2>
              <p className="text-gray-500 mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-shop_dark_green hover:text-shop_light_green font-medium">
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 4).map((category, index) => (
              <Link key={index} href={category.href}>
                <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-white">
                    <h3 className="font-semibold text-lg drop-shadow-lg">
                      {category.name}
                    </h3>
                    <p className="text-sm text-white/90 mt-1 drop-shadow-md">{category.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-shop_orange/10 text-shop_orange border-shop_orange/20">
                Featured
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Handpicked Just for You
              </h2>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-shop_dark_green hover:text-shop_light_green font-medium">
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-gray-500">Check back soon for amazing deals!</p>
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link href="/products">
              <Button variant="outline" className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* All Products Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                New Arrivals
              </h2>
              <p className="text-gray-500 mt-1">Latest products added to our store</p>
            </div>
            <Link href="/products?sort=newest" className="hidden md:flex items-center gap-1 text-shop_dark_green hover:text-shop_light_green font-medium">
              See More
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-shop_dark_green text-white">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Start Your Business
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Turn Your Products Into Profit
              </h2>
              <p className="text-lg text-white/80">
                Join thousands of successful sellers on Zimbabwe&apos;s fastest-growing marketplace. 
                Start your business journey with zero upfront costs.
              </p>
              <div className="flex flex-wrap gap-4">
                {!user?.isSeller && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        login();
                      } else {
                        router.push("/become-a-seller");
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-shop_orange hover:bg-shop_orange/90 text-white px-8 h-12"
                  >
                    Become a Seller
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                )}
                <Link href="/help/seller">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/50 text-white bg-transparent hover:bg-white/10 hover:text-white px-8 h-12"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold">0%</div>
                  <div className="text-white/70 text-sm mt-1">Upfront Fees</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold">24/7</div>
                  <div className="text-white/70 text-sm mt-1">Support</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold">5K+</div>
                  <div className="text-white/70 text-sm mt-1">Active Sellers</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold">Fast</div>
                  <div className="text-white/70 text-sm mt-1">Payouts</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}


