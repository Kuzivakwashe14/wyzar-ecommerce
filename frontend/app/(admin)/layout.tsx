'use client';

import { useAuth } from '@/context/AuthContent';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  CheckCircle,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Shield,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-shop_dark_green">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_light_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-shop_light_pink">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Sellers', href: '/admin/sellers', icon: Store },
    { name: 'Pending Sellers', href: '/admin/sellers/pending', icon: CheckCircle },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Access Control', href: '/admin/access-control', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-sm">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-52' : 'w-14'
        } bg-shop_dark_green border-r border-shop_light_green/20 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-shop_light_green/20">
          {sidebarOpen ? (
            <div>
              <h1 className="text-base font-bold text-white">WyZar</h1>
              <p className="text-[10px] text-shop_light_green">Admin Portal</p>
            </div>
          ) : (
            <div className="text-lg font-bold text-white mx-auto">W</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 mx-1.5 rounded-md transition-all text-xs ${
                  isActive
                    ? 'bg-shop_light_green text-white'
                    : 'text-shop_light_pink/80 hover:bg-shop_light_green/20 hover:text-white'
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-shop_light_green/20 p-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-shop_light_pink/80 hover:bg-shop_light_green/20 hover:text-shop_light_green transition-all mb-1 text-xs"
            title={!sidebarOpen ? 'Back to Marketplace' : undefined}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="font-medium">Marketplace</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-shop_light_pink/80 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-2 px-3 py-2 bg-shop_light_green/10 rounded-md">
              <p className="text-[10px] text-shop_light_pink/60">Logged in as</p>
              <p className="text-xs text-white font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-shop_light_green">Admin</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-shop_dark_green transition-all"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-shop_dark_green hover:bg-shop_light_green text-white transition-all text-xs font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-800">{user.email}</p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-shop_dark_green flex items-center justify-center text-white text-xs font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
