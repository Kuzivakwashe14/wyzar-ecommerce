"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Send,
  CreditCard,
  Truck,
  Shield,
  RotateCcw,
  Loader2,
} from "lucide-react";

const footerLinks = {
  shop: [
    { name: "All Products", href: "/products" },
    { name: "Electronics", href: "/products?category=Electronics" },
    { name: "Fashion", href: "/products?category=Fashion" },
    { name: "Home & Living", href: "/products?category=Home" },
    { name: "Mobile & Accessories", href: "/products?category=Mobile" },
  ],
  account: [
    { name: "My Account", href: "/account" },
    { name: "My Orders", href: "/my-orders" },
    { name: "Wishlist", href: "/wishlist" },
    { name: "Track Order", href: "/my-orders" },
    { name: "Messages", href: "/messages" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
    { name: "Become a Seller", href: "/become-a-seller" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "FAQs", href: "/faq" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns & Refunds", href: "/returns" },
    { name: "Payment Options", href: "/payment-options" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

const features = [
  { icon: Truck, title: "Free Shipping", description: "On orders over $50" },
  { icon: RotateCcw, title: "Easy Returns", description: "30 days return policy" },
  { icon: Shield, title: "Secure Payment", description: "100% secure checkout" },
  { icon: CreditCard, title: "Multiple Payment", description: "Various payment methods" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual newsletter API when available
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Store in localStorage as backup until API is ready
      const subscribers = JSON.parse(localStorage.getItem("newsletter_subscribers") || "[]");
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("newsletter_subscribers", JSON.stringify(subscribers));
      }

      toast.success("Welcome! You've successfully subscribed to our newsletter.", {
        description: "You'll receive updates on new products and exclusive offers.",
      });
      setEmail("");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-shop_dark_green text-white">




      {/* Main Footer Content */}
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo variant="footer" />
            <p className="mt-4 text-white/70 text-sm leading-relaxed">
              WyZar is your one-stop destination for quality products at unbeatable prices. 
              Shop from thousands of sellers and find everything you need.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-5 w-5 text-shop_orange shrink-0" />
                <span className="text-white/70">123 Commerce Street, Business District</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-shop_orange shrink-0" />
                <span className="text-white/70">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-shop_orange shrink-0" />
                <span className="text-white/70">support@wyzar.com</span>
              </div>
            </div>
            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social, index) => (
                <Link 
                  key={index} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-shop_orange transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-shop_orange transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Account</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-shop_orange transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-shop_orange transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-shop_orange transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm text-center md:text-left">
              © {new Date().getFullYear()} WyZar. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

