"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchUnreadCount = async () => {
    // Only fetch if authenticated
    if (!isAuthenticated || !user) return;
    
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Top Bar */}
      <div className="border-b bg-muted/30 dark:bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Link href="/become-a-seller" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Sell on WyZar</span>
              </Link>
              <span className="text-muted-foreground hidden md:inline">|</span>
              <span className="text-muted-foreground hidden md:inline">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/my-orders" className="hover:text-primary transition-colors hidden sm:inline">
                Track Order
              </Link>
              <Link href="/help" className="hover:text-primary transition-colors hidden sm:inline">
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
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Link href="/" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>
                    WyZar
                  </Link>
                  <div className="space-y-2">

                    <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Package className="mr-2 h-4 w-4" />
                        All Products
                      </Button>
                    </Link>
                    <div className="py-2">
                      <p className="px-4 text-sm font-semibold text-muted-foreground mb-2">Categories</p>
                      {categories.map((category) => (
                        <Link key={category.name} href={category.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
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
              <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                WyZar
              </span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>


                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      {categories.map((category) => (
                        <Link key={category.name} href={category.href}>
                          <div className="group flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <category.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium leading-none">{category.name}</p>
                              <p className="text-sm text-muted-foreground">Browse {category.name.toLowerCase()}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <Link href="/products">
                        <div className="group flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors md:col-span-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium leading-none">All Products</p>
                            <p className="text-sm text-muted-foreground">Explore our entire collection</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/products">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
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
                    <Button variant="outline" size="sm" className="gap-1">
                      <Store className="h-4 w-4" />
                      Sell
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-linear-to-br from-purple-600 to-blue-600 text-gray-900">
                          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.isSeller ? user.sellerDetails?.businessName : 'My Account'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.isSeller && (
                      <>
                        <Link href="/dashboard">
                          <DropdownMenuItem>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Seller Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/orders">
                          <DropdownMenuItem>
                            <Package className="mr-2 h-4 w-4" />
                            <span>My Sales</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/settings">
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Seller Settings</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {user.role === 'admin' ? (
                      <Link href="/admin">
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Portal</span>
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/my-orders">
                        <DropdownMenuItem>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="gap-1">
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Messages with Badge */}
            {isAuthenticated && user && (
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
}

