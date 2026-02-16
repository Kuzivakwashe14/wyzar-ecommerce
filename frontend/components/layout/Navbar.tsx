"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { api } from "@/context/AuthContent";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContent";
import { useCart } from "@/context/CartContext";
import CartSheet from "./CartSheet";
import {
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Search,
  Menu,
  Store,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Smartphone,
  Sparkles,
  Package,
  Shield,
  MessageCircle
} from "lucide-react";

const categories = [
  { name: "Electronics", icon: Laptop, href: "/products?category=Electronics" },
  { name: "Fashion", icon: Shirt, href: "/products?category=Fashion" },
  { name: "Home & Living", icon: HomeIcon, href: "/products?category=Home" },
  { name: "Mobile & Accessories", icon: Smartphone, href: "/products?category=Mobile" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout, login } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-line" style={{ background: 'rgba(250, 247, 242, 0.9)', backdropFilter: 'blur(16px)' }}>
      {/* Top Bar */}
      <div className="border-b border-line bg-sand/50">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    login();
                  } else {
                    router.push("/become-a-seller");
                  }
                }}
                className="flex items-center gap-1 text-brown-light hover:text-terracotta transition-colors"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Sell on WyZar</span>
              </button>
              <span className="text-brown-light hidden md:inline">|</span>
              <span className="text-brown-light hidden md:inline">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/my-orders" className="text-brown-light hover:text-terracotta transition-colors hidden sm:inline">
                Track Order
              </Link>
              <Link href="/help" className="text-brown-light hover:text-terracotta transition-colors hidden sm:inline">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Logo & Navigation */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-brown hover:bg-sand">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-cream">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Link href="/" className="font-[family-name:var(--font-caveat)] text-2xl font-bold text-terracotta" onClick={() => setMobileMenuOpen(false)}>
                    WyZar
                  </Link>
                  <div className="space-y-2">
                    <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-brown hover:bg-sand hover:text-terracotta">
                        <Package className="mr-2 h-4 w-4" />
                        All Products
                      </Button>
                    </Link>
                    <div className="py-2">
                      <p className="px-4 text-sm font-semibold text-brown-light mb-2">Categories</p>
                      {categories.map((category) => (
                        <Link key={category.name} href={category.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-brown-mid hover:bg-sand hover:text-terracotta">
                            <category.icon className="mr-2 h-4 w-4" />
                            {category.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-caveat)] text-3xl font-bold text-terracotta">
                WyZar
              </span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-brown-light hover:text-terracotta">Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-cream">
                      {categories.map((category) => (
                        <Link key={category.name} href={category.href}>
                          <div className="group flex items-start gap-3 rounded-2xl p-3 hover:bg-sand transition-colors">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 group-hover:bg-terracotta/20 transition-colors">
                              <category.icon className="h-5 w-5 text-terracotta" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold leading-none text-brown">{category.name}</p>
                              <p className="text-sm text-brown-light">Browse {category.name.toLowerCase()}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <Link href="/products">
                        <div className="group flex items-start gap-3 rounded-2xl p-3 hover:bg-sand transition-colors md:col-span-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/10 group-hover:bg-sage/20 transition-colors">
                            <Sparkles className="h-5 w-5 text-sage" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold leading-none text-brown">All Products</p>
                            <p className="text-sm text-brown-light">Explore our entire collection</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/products" className="text-brown-light hover:text-terracotta">
                      Trending
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Center Section: Search Bar */}
          <div className="hidden sm:flex flex-1 justify-center max-w-md mx-auto">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-light" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full bg-sand border-line rounded-full focus:border-terracotta focus:ring-terracotta/20"
                />
              </div>
            </form>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {!user.isSeller && (
                  <Link href="/become-a-seller" className="hidden lg:block">
                    <Button variant="outline" size="sm" className="gap-1 border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">
                      <Store className="h-4 w-4" />
                      Sell
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-terracotta text-white font-semibold">
                          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-cream border-line rounded-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-brown">
                          {user.isSeller ? user.sellerDetails?.businessName : 'My Account'}
                        </p>
                        <p className="text-xs leading-none text-brown-light truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-line" />

                    {user.isSeller && (
                      <>
                        <Link href="/dashboard">
                          <DropdownMenuItem className="hover:bg-sand focus:bg-sand cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-terracotta" />
                            <span>Seller Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/orders">
                          <DropdownMenuItem className="hover:bg-sand focus:bg-sand cursor-pointer">
                            <Package className="mr-2 h-4 w-4 text-terracotta" />
                            <span>My Sales</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/settings">
                          <DropdownMenuItem className="hover:bg-sand focus:bg-sand cursor-pointer">
                            <Settings className="mr-2 h-4 w-4 text-terracotta" />
                            <span>Seller Settings</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-line" />
                      </>
                    )}

                    {(user.role === 'admin' || user.role === 'ADMIN') ? (
                      <Link href="/admin">
                        <DropdownMenuItem className="hover:bg-sand focus:bg-sand cursor-pointer">
                          <Shield className="mr-2 h-4 w-4 text-sage" />
                          <span>Portal</span>
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/my-orders">
                        <DropdownMenuItem className="hover:bg-sand focus:bg-sand cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4 text-terracotta" />
                          <span>My Orders</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <DropdownMenuSeparator className="bg-line" />
                    <DropdownMenuItem onClick={() => logout()} className="hover:bg-sand focus:bg-sand cursor-pointer text-terracotta">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-brown-light hover:text-terracotta hover:bg-sand">Login</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="gap-1 bg-terracotta hover:bg-brown text-white rounded-full">
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                </SignUpButton>
              </>
            )}

            {/* Messages with Badge */}
            {isAuthenticated && user && (
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative text-brown hover:bg-sand hover:text-terracotta">
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-terracotta text-white"
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Cart with Badge */}
            <div className="relative">
              <CartSheet />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-terracotta text-white"
                >
                  {itemCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-4 sm:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-light" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 bg-sand border-line rounded-full focus:border-terracotta"
              />
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
}
