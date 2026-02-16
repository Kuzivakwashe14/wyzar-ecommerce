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
  ArrowLeft,
  CreditCard
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'ADMIN'))) {
      login();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brown">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sage border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Sellers', href: '/admin/sellers', icon: Store },
    { name: 'Pending Sellers', href: '/admin/sellers/pending', icon: CheckCircle },
    { name: 'Verify Payments', href: '/admin/orders/payments', icon: CreditCard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Access Control', href: '/admin/access-control', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-sm">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-52' : 'w-14'
        } bg-brown border-r border-sage/20 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-sage/20">
          {sidebarOpen ? (
            <div>
              <h1 className="text-base font-bold text-white">WyZar</h1>
              <p className="text-[10px] text-sage">Admin Portal</p>
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
                    ? 'bg-sage text-white'
                    : 'text-cream/80 hover:bg-sage/20 hover:text-white'
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
        <div className="border-t border-sage/20 p-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-cream/80 hover:bg-sage/20 hover:text-sage transition-all mb-1 text-xs"
            title={!sidebarOpen ? 'Back to Marketplace' : undefined}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="font-medium">Marketplace</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-cream/80 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-2 px-3 py-2 bg-sage/10 rounded-md">
              <p className="text-[10px] text-cream/60">Logged in as</p>
              <p className="text-xs text-white font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-sage">Admin</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-12 bg-white border-b border-line flex items-center justify-between px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-sand text-brown-light hover:text-brown transition-all"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta hover:bg-brown text-white transition-all text-xs font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>
            <div className="text-right">
              <p className="text-xs font-medium text-brown">{user.email}</p>
              <p className="text-[10px] text-brown-light">Administrator</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-brown flex items-center justify-center text-white text-xs font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-sand p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

