"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/context/AuthContent";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContent";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import CartSheet from "./CartSheet";
import MobileMenu from "./MobileMenu";
import {
  Search,
  Heart,
  User,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Package,
  Shield,
  MessageCircle,
  Store,
  ChevronDown,
} from "lucide-react";

const categories = [
  { name: "Electronics", href: "/products?category=Electronics" },
  { name: "Fashion", href: "/products?category=Fashion" },
  { name: "Home & Living", href: "/products?category=Home" },
  { name: "Mobile & Accessories", href: "/products?category=Mobile" },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const initFetch = async () => {
      if (isAuthenticated && user) {
        await fetchUnreadCount();
        interval = setInterval(fetchUnreadCount, 30000);
      }
    };
    
    initFetch();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user, fetchUnreadCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-shop_dark_green text-white py-2">
        <Container>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Link 
                href="/become-a-seller" 
                className="flex items-center gap-1 hover:text-shop_orange transition-colors"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Sell on WyZar</span>
              </Link>
              <span className="hidden md:inline text-white/60">|</span>
              <span className="hidden md:inline text-white/80">
                Free shipping on orders over $50
              </span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <Link 
                href="/my-orders" 
                className="hover:text-shop_orange transition-colors hidden sm:inline"
              >
                Track Order
              </Link>
              <Link 
                href="/help" 
                className="hover:text-shop_orange transition-colors hidden sm:inline"
              >
                Help
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Header */}
      <div className="bg-shop_light_pink py-4">
        <Container>
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu categories={categories} />
            </div>

            {/* Logo */}
            <Logo />

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex items-center">
                  <Input
                    type="search"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-5 rounded-full border-2 border-shop_dark_green/20 focus:border-shop_dark_green bg-white"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1 bg-shop_dark_green hover:bg-shop_light_green text-white p-2.5 rounded-full transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* User Account */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="hoverEffect hover:bg-shop_dark_green/10 flex items-center gap-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-shop_dark_green text-white text-sm">
                          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm font-medium">
                        {user.isSeller ? user.sellerDetails?.businessName : 'Account'}
                      </span>
                      <ChevronDown className="h-4 w-4 hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.isSeller ? user.sellerDetails?.businessName : 'My Account'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.isSeller && (
                      <>
                        <Link href="/dashboard">
                          <DropdownMenuItem className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Seller Dashboard
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/orders">
                          <DropdownMenuItem className="cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            My Sales
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard/settings">
                          <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Seller Settings
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {user.role === 'admin' ? (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Portal
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/my-orders">
                        <DropdownMenuItem className="cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          My Orders
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      className="hoverEffect hover:bg-shop_dark_green/10"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-shop_dark_green hover:bg-shop_light_green text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Wishlist */}
              <Link href="/wishlist">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hoverEffect hover:bg-shop_dark_green/10 relative"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Messages */}
              {isAuthenticated && user && (
                <Link href="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hoverEffect hover:bg-shop_dark_green/10 relative"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-shop_orange text-white">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <div className="relative">
                <CartSheet />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-shop_orange text-white pointer-events-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center">
                <Input
                  type="search"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 rounded-full border-2 border-shop_dark_green/20 focus:border-shop_dark_green"
                />
                <button 
                  type="submit"
                  className="absolute right-1 bg-shop_dark_green hover:bg-shop_light_green text-white p-2 rounded-full transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </Container>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white border-b border-gray-200 hidden md:block">
        <Container>
          <nav className="flex items-center justify-between py-3">
            {/* Categories */}
            <div className="flex items-center gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hoverEffect hover:text-shop_dark_green font-semibold gap-1"
                  >
                    All Categories
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {categories.map((category) => (
                    <Link key={category.name} href={category.href}>
                      <DropdownMenuItem className="cursor-pointer">
                        {category.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                  <Link href="/products">
                    <DropdownMenuItem className="cursor-pointer font-medium text-shop_dark_green">
                      View All Products
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link 
                href="/products" 
                className="text-sm font-medium hover:text-shop_dark_green transition-colors hoverEffect"
              >
                All Products
              </Link>
              <Link 
                href="/products?featured=true" 
                className="text-sm font-medium hover:text-shop_dark_green transition-colors hoverEffect"
              >
                Featured
              </Link>
              <Link 
                href="/products?sort=newest" 
                className="text-sm font-medium hover:text-shop_dark_green transition-colors hoverEffect"
              >
                New Arrivals
              </Link>
              <Link 
                href="/products?sort=popular" 
                className="text-sm font-medium hover:text-shop_dark_green transition-colors hoverEffect"
              >
                Trending
              </Link>
            </div>

            {/* Seller Link */}
            {isAuthenticated && user && !user.isSeller && (
              <Link href="/become-a-seller">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-shop_orange text-shop_orange hover:bg-shop_orange hover:text-white"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Start Selling
                </Button>
              </Link>
            )}
          </nav>
        </Container>
      </div>
    </header>
  );
}
