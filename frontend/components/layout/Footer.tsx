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
    { name: "About Us", href: "/about-us" },
    { name: "Contact Us", href: "/contact-us" },
    { name: "Become a Seller", href: "/become-a-seller" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
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

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
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
    <footer className="bg-sand border-t border-line">
      {/* Newsletter */}
      <div className="bg-brown text-sand">
        <Container>
          <div className="py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-[family-name:var(--font-caveat)] text-2xl font-bold text-terracotta-light">Stay in the loop ✨</h3>
              <p className="text-sand-warm/60 text-sm mt-1">Get updates on new products, sellers, and exclusive deals.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-brown-mid/30 border-brown-mid text-sand placeholder:text-sand-warm/40 rounded-full focus:border-terracotta"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-terracotta hover:bg-terracotta-light text-white rounded-full px-6"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Container>
      </div>

      {/* Main Footer Content */}
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo variant="sm" />
            <p className="mt-4 text-brown-light text-sm leading-relaxed">
              WyZar is your one-stop destination for quality products at unbeatable prices. 
              Shop from thousands of sellers and find everything you need.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-5 w-5 text-terracotta shrink-0" />
                <span className="text-brown-light">Borrowdale, Harare, Zimbabwe</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-terracotta shrink-0" />
                <span className="text-brown-light">+263 77 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-terracotta shrink-0" />
                <span className="text-brown-light">support@wyzar.com</span>
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
                  className="h-10 w-10 rounded-full bg-brown/10 flex items-center justify-center hover:bg-terracotta hover:text-white text-brown-light transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-brown uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-brown-light hover:text-terracotta transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-brown uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-brown-light hover:text-terracotta transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-brown uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-brown-light hover:text-terracotta transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-brown uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-brown-light hover:text-terracotta transition-colors text-sm"
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
      <div className="border-t border-line">
        <Container>
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-brown-light text-sm text-center md:text-left">
              © {new Date().getFullYear()} WyZar Community. Made with ❤️ in Zimbabwe.
            </p>
            <div className="flex items-center gap-6 text-sm text-brown-light">
              <Link href="/privacy-policy" className="hover:text-terracotta transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-conditions" className="hover:text-terracotta transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-terracotta transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
