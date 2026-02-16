"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import Container from "@/components/Container";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Users,
  Star,
  Heart,
  Store,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Smartphone,
  Sparkles,
  Package,
  ChevronRight,
} from "lucide-react";

const categories = [
  { name: "Electronics", icon: Laptop, href: "/products?category=Electronics", color: "bg-terracotta/10 text-terracotta" },
  { name: "Fashion", icon: Shirt, href: "/products?category=Fashion", color: "bg-sage/10 text-sage" },
  { name: "Home & Living", icon: HomeIcon, href: "/products?category=Home", color: "bg-terracotta-light/10 text-terracotta-light" },
  { name: "Mobile", icon: Smartphone, href: "/products?category=Mobile", color: "bg-brown-light/10 text-brown-mid" },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Trusted & Verified",
    description: "Every seller is verified. Shop with complete confidence.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Reliable delivery across Zimbabwe's major cities.",
  },
  {
    icon: CreditCard,
    title: "Local Payments",
    description: "EcoCash, Innbucks, and Bank Transfer supported.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "Supporting local businesses and entrepreneurs.",
  },
];

const communityStats = [
  { value: "2,500+", label: "Active Sellers" },
  { value: "50,000+", label: "Happy Customers" },
  { value: "100,000+", label: "Products Listed" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get("/products?limit=8&sort=newest");
        setFeaturedProducts(response.data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #faf7f2 0%, #f5efe6 40%, #ede5d8 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c4654a 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7a9e7e 0%, transparent 70%)' }} />
        </div>
        <Container>
          <div className="relative py-16 md:py-24 lg:py-32">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl md:text-2xl">
                  ✨ Zimbabwe&apos;s Community Marketplace
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-brown mt-4 leading-tight"
              >
                Discover. Connect.{" "}
                <span className="font-[family-name:var(--font-caveat)] text-terracotta">
                  Thrive Together.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-brown-light mt-6 max-w-2xl"
              >
                Join thousands of Zimbabweans buying and selling locally. Quality products from trusted sellers, delivered to your doorstep.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mt-8"
              >
                <Link href="/products">
                  <Button size="lg" className="bg-terracotta hover:bg-brown text-white rounded-full px-8 h-12 text-base group">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/become-a-seller">
                  <Button size="lg" variant="outline" className="border-brown text-brown hover:bg-brown hover:text-cream rounded-full px-8 h-12 text-base">
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Community Stats */}
      <section className="py-12 border-b border-line">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-terracotta font-[family-name:var(--font-caveat)]">
                  {stat.value}
                </p>
                <p className="text-sm text-brown-light mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-16">
        <Container>
          <div className="text-center mb-10">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Browse by</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brown mt-1">Popular Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <div className="group p-6 bg-white rounded-2xl border border-line hover:border-terracotta/30 hover:shadow-md transition-all duration-300 text-center"
                       style={{ borderRadius: '20px' }}>
                    <div className={`h-14 w-14 rounded-2xl ${category.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-brown group-hover:text-terracotta transition-colors">{category.name}</h3>
                    <p className="text-sm text-brown-light mt-1 flex items-center justify-center gap-1">
                      Browse
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-sand/50">
        <Container>
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Handpicked for you</span>
              <h2 className="text-3xl md:text-4xl font-bold text-brown mt-1">Featured Products</h2>
            </div>
            <Link href="/products">
              <Button variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full hidden sm:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-sand rounded-2xl aspect-square mb-4" />
                  <div className="h-4 bg-sand rounded w-1/3 mb-2" />
                  <div className="h-5 bg-sand rounded w-2/3 mb-2" />
                  <div className="h-4 bg-sand rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-brown-light/30 mx-auto mb-4" />
              <p className="text-brown-light text-lg">No products yet. Be the first to sell!</p>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Features / Why Choose Us */}
      <section className="py-16">
        <Container>
          <div className="text-center mb-10">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Why WyZar?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brown mt-1">Built for Trust</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group text-center p-6 bg-white rounded-2xl border border-line hover:border-terracotta/30 hover:shadow-md transition-all duration-300"
                style={{ borderRadius: '20px' }}
              >
                <div className="h-14 w-14 rounded-2xl bg-terracotta/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-terracotta/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-terracotta" />
                </div>
                <h3 className="font-semibold text-brown mb-2">{feature.title}</h3>
                <p className="text-sm text-brown-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20" style={{ background: 'linear-gradient(135deg, #3d2c1e 0%, #5e4a3a 100%)' }}>
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta-light text-2xl">Join our community</span>
            <h2 className="text-3xl md:text-4xl font-bold text-cream mt-2">
              Start Selling on WyZar Today
            </h2>
            <p className="text-sand-warm/60 mt-4 text-lg">
              Reach thousands of customers across Zimbabwe. Set up your store in minutes and start growing your business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Link href="/become-a-seller">
                <Button size="lg" className="bg-terracotta hover:bg-terracotta-light text-white rounded-full px-8 h-12 text-base">
                  <Store className="mr-2 h-5 w-5" />
                  Open Your Store
                </Button>
              </Link>
              <Link href="/about-us">
                <Button size="lg" variant="outline" className="border-cream/30 text-cream hover:bg-cream/10 rounded-full px-8 h-12 text-base">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
