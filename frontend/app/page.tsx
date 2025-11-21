"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag,
  TruckIcon,
  ShieldCheck,
  CreditCard,
  Zap,
  Star,
  ArrowRight,
  Smartphone,
  Home,
  Shirt,
  Laptop
} from "lucide-react";

// Featured categories
const categories = [
  { name: "Electronics", icon: Laptop, color: "bg-blue-500", href: "/products?category=Electronics" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-500", href: "/products?category=Fashion" },
  { name: "Home & Living", icon: Home, color: "bg-green-500", href: "/products?category=Home" },
  { name: "Mobile & Accessories", icon: Smartphone, color: "bg-purple-500", href: "/products?category=Mobile" },
];

// Trust features
const features = [
  {
    icon: TruckIcon,
    title: "Fast Delivery",
    description: "Quick delivery across Zimbabwe"
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    description: "100% secure payment"
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Paynow, Ecocash & Cash on Delivery"
  },
  {
    icon: Zap,
    title: "24/7 Support",
    description: "Dedicated customer support"
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/products");
        setProducts(response.data.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] bg-linear-to-br from-purple-600 via-purple-700 to-blue-800 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-1">
              Zimbabwe&apos;s Premier Online Marketplace
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Shop Smarter,
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-200 to-pink-200">
                Live Better
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 max-w-2xl mx-auto">
              Discover thousands of products from local and international sellers. Quality guaranteed, delivered to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/products">
                <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Shopping
                </Button>
              </Link>
              <Link href="/become-a-seller">
                <Button size="lg" variant="outline" className="border-white/30 text-purple-700 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                  Become a Seller
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">10K+</div>
                <div className="text-purple-200 text-sm mt-1">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">5K+</div>
                <div className="text-purple-200 text-sm mt-1">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">500+</div>
                <div className="text-purple-200 text-sm mt-1">Sellers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-none bg-transparent">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground text-lg">Find exactly what you&apos;re looking for</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={category.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary">
                <CardContent className="p-8 text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Handpicked items just for you</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="hidden md:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground">Check back soon for amazing deals!</p>
            </div>
          )}

          <div className="text-center mt-12 md:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full sm:w-auto">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Start Selling Today
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Turn Your Products Into Profit
            </h2>
            <p className="text-xl text-purple-100">
              Join thousands of successful sellers on Zimbabwe&apos;s fastest-growing marketplace.
              Start your business journey with zero upfront costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/become-a-seller">
                <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                  <Star className="mr-2 h-5 w-5" />
                  Become a Seller
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-white/30 text-purple-700 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
