"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContent";
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
        <Button variant="ghost" size="icon" className="hoverEffect">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
        <SheetHeader className="p-4 bg-shop_dark_green text-white">
          <div className="flex items-center justify-between">
            <Logo variant="sm" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="px-4 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-shop_dark_green text-white flex items-center justify-center text-lg font-semibold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-semibold">
                    {user.isSeller ? user.sellerDetails?.businessName : 'Welcome back!'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 border-b space-y-2">
              <Link href="/login" onClick={handleClose}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/sign-up" onClick={handleClose}>
                <Button className="w-full justify-start gap-2 bg-shop_dark_green hover:bg-shop_light_green text-white">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Button>
              </Link>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 py-4 space-y-1">
            <Link href="/" onClick={handleClose}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                <Home className="h-5 w-5 text-shop_dark_green" />
                Home
              </Button>
            </Link>

            <Link href="/products" onClick={handleClose}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                <Package className="h-5 w-5 text-shop_dark_green" />
                All Products
              </Button>
            </Link>

            {/* Categories Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent rounded-md">
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-shop_dark_green" />
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
                        className="w-full justify-start gap-2 h-10 pl-8"
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
              <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                <Heart className="h-5 w-5 text-shop_dark_green" />
                Wishlist
              </Button>
            </Link>
          </div>

          {/* User Account Section */}
          {isAuthenticated && user && (
            <>
              <div className="border-t my-2" />
              <div className="px-2 py-2 space-y-1">
                <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                  My Account
                </p>

                {user.isSeller ? (
                  <>
                    <Link href="/dashboard" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <LayoutDashboard className="h-5 w-5 text-shop_dark_green" />
                        Seller Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard/orders" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <ShoppingBag className="h-5 w-5 text-shop_dark_green" />
                        My Sales
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <Settings className="h-5 w-5 text-shop_dark_green" />
                        Seller Settings
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/my-orders" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <ShoppingBag className="h-5 w-5 text-shop_dark_green" />
                        My Orders
                      </Button>
                    </Link>
                    <Link href="/account" onClick={handleClose}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <User className="h-5 w-5 text-shop_dark_green" />
                        Account Settings
                      </Button>
                    </Link>
                  </>
                )}

                {(user.role === 'admin' || user.role === 'ADMIN') && (
                  <Link href="/admin" onClick={handleClose}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                      <Shield className="h-5 w-5 text-shop_orange" />
                      Admin Portal
                    </Button>
                  </Link>
                )}

                {!user.isSeller && (
                  <Link href="/become-a-seller" onClick={handleClose}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                      <Store className="h-5 w-5 text-shop_orange" />
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
              <div className="border-t my-2" />
              <div className="px-2 py-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
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

