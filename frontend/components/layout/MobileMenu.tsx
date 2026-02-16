"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContent";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  Package,
  Heart,
  User,
  Store,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

interface Category {
  name: string;
  href: string;
}

interface MobileMenuProps {
  categories: Category[];
}

export default function MobileMenu({ categories }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleClose = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hoverEffect text-brown hover:bg-sand">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 overflow-y-auto bg-cream">
        <SheetHeader className="p-4 bg-brown text-sand">
          <div className="flex items-center justify-between">
            <Logo variant="sm" dark />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-sand hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="px-4 pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-terracotta text-white flex items-center justify-center text-lg font-semibold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-semibold text-brown">
                    {user.isSeller ? user.sellerDetails?.businessName : 'Welcome back!'}
                  </p>
                  <p className="text-sm text-brown-light truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 border-b border-line space-y-2">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full justify-start gap-2 border-line text-brown hover:bg-sand" onClick={handleClose}>
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="w-full justify-start gap-2 bg-terracotta hover:bg-terracotta-light text-white" onClick={handleClose}>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Button>
              </SignUpButton>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 py-4 space-y-1">
            <Link href="/" onClick={handleClose}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                <Home className="h-5 w-5 text-terracotta" />
                Home
              </Button>
            </Link>

            <Link href="/products" onClick={handleClose}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                <Package className="h-5 w-5 text-terracotta" />
                All Products
              </Button>
            </Link>

            {/* Categories Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-sand rounded-2xl text-brown">
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-terracotta" />
                    Categories
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-4">
                  {categories.map((category) => (
                    <Link 
                      key={category.name} 
                      href={category.href}
                      onClick={handleClose}
                    >
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-2 h-10 pl-8 text-brown-mid hover:bg-sand hover:text-terracotta"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {category.name}
                      </Button>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Link href="/wishlist" onClick={handleClose}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                <Heart className="h-5 w-5 text-terracotta" />
                Wishlist
              </Button>
            </Link>

            {isAuthenticated && (
              <Link href="/messages" onClick={handleClose}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                  <MessageCircle className="h-5 w-5 text-terracotta" />
                  Messages
                </Button>
              </Link>
            )}
          </div>

          {/* User Account Section */}
          {isAuthenticated && user && (
            <>
              <div className="border-t border-line my-2" />
              <div className="px-2 py-2 space-y-1">
                <p className="px-4 py-2 text-sm font-semibold text-brown-light">
                  My Account
                </p>

                {user.isSeller ? (
                  <>
                    <Link href="/dashboard" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                        <LayoutDashboard className="h-5 w-5 text-sage" />
                        Seller Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard/orders" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                        <ShoppingBag className="h-5 w-5 text-sage" />
                        My Sales
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                        <Settings className="h-5 w-5 text-sage" />
                        Seller Settings
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/my-orders" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                        <ShoppingBag className="h-5 w-5 text-sage" />
                        My Orders
                      </Button>
                    </Link>
                    <Link href="/account" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                        <User className="h-5 w-5 text-sage" />
                        Account Settings
                      </Button>
                    </Link>
                  </>
                )}

                {(user.role === 'admin' || user.role === 'ADMIN') && (
                  <Link href="/admin" onClick={handleClose}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                      <Shield className="h-5 w-5 text-terracotta" />
                      Admin Portal
                    </Button>
                  </Link>
                )}

                {!user.isSeller && (
                  <Link href="/become-a-seller" onClick={handleClose}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-brown hover:bg-sand hover:text-terracotta">
                      <Store className="h-5 w-5 text-terracotta" />
                      Become a Seller
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Logout */}
          {isAuthenticated && (
            <>
              <div className="border-t border-line my-2" />
              <div className="px-2 py-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-12 text-terracotta hover:text-terracotta hover:bg-terracotta/10"
                  onClick={() => {
                    logout();
                    handleClose();
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
