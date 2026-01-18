'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: {
    total: number;
    sellers: number;
    pendingSellers: number;
  };
  products: {
    total: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  commission: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
}

interface RecentOrder {
  id: string;
  totalPrice: number;
  status: string;
  user?: {
    email: string;
  };
}

interface RecentUser {
  id: string;
  email: string;
  phone: string;
  isSeller: boolean;
  isVerified: boolean;
}

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  seller?: {
    email: string;
  };
}

interface RecentActivity {
  recentOrders: RecentOrder[];
  recentUsers: RecentUser[];
  recentProducts: RecentProduct[];
}

export default function AdminDashboard() {
  const { axiosInstance } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        axiosInstance.get('/admin/stats/overview'),
        axiosInstance.get('/admin/stats/recent-activity')
      ]);

      setStats(statsRes.data.stats);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_light_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p className="text-gray-600 text-sm">Welcome to WyZar Admin Portal</p>
      </div>

      {/* Pending Actions Alert */}
      {stats && stats.users.pendingSellers > 0 && (
        <div className="bg-shop_orange/10 border border-shop_orange/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-shop_orange mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-shop_orange font-medium text-sm">Pending Actions Required</p>
            <p className="text-shop_orange/80 text-xs mt-0.5">
              You have {stats.users.pendingSellers} pending seller verification(s) waiting for review
            </p>
          </div>
          <Link
            href="/admin/sellers/pending"
            className="px-3 py-1.5 bg-shop_orange hover:bg-shop_orange/90 text-gray-900 rounded-md text-xs font-medium transition-all"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-shop_dark_green transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-shop_dark_green/10 rounded-md">
              <Users className="w-4 h-4 text-shop_dark_green" />
            </div>
            <span className="text-[10px] text-gray-500">Total</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {stats?.users.total.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs">Registered Users</p>
        </div>

        {/* Total Sellers */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-shop_light_green transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-shop_light_green/10 rounded-md">
              <Store className="w-4 h-4 text-shop_light_green" />
            </div>
            <span className="text-[10px] text-gray-500">Verified</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {stats?.users.sellers.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs">Active Sellers</p>
          {stats && stats.users.pendingSellers > 0 && (
            <p className="text-shop_orange text-[10px] mt-1">
              {stats.users.pendingSellers} pending
            </p>
          )}
        </div>

        {/* Total Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-shop_orange transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-shop_orange/10 rounded-md">
              <Package className="w-4 h-4 text-shop_orange" />
            </div>
            <span className="text-[10px] text-gray-500">Catalog</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {stats?.products.total.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs">Total Products</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-shop_dark_green transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-shop_light_pink rounded-md">
              <ShoppingCart className="w-4 h-4 text-shop_dark_green" />
            </div>
            <span className="text-[10px] text-gray-500">All Time</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {stats?.orders.total.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs">Total Orders</p>
          <p className="text-shop_light_green text-[10px] mt-1">
            {stats?.orders.today} today
          </p>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's Revenue */}
        <div className="bg-linear-to-br from-shop_dark_green to-shop_light_green rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/10 rounded-md">
              <DollarSign className="w-4 h-4 text-gray-900" />
            </div>
            <Clock className="w-4 h-4 text-gray-900/60" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            ${stats?.revenue.today.toLocaleString()}
          </h3>
          <p className="text-shop_light_pink text-xs">Today&apos;s Revenue</p>
          <p className="text-gray-900/80 text-[10px] mt-1">
            Commission: ${stats?.commission.today.toLocaleString()}
          </p>
        </div>

        {/* This Week */}
        <div className="bg-linear-to-br from-shop_light_green to-emerald-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/10 rounded-md">
              <TrendingUp className="w-4 h-4 text-gray-900" />
            </div>
            <span className="text-gray-900/60 text-[10px]">7 days</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            ${stats?.revenue.thisWeek.toLocaleString()}
          </h3>
          <p className="text-gray-900/90 text-xs">This Week</p>
          <p className="text-gray-900/80 text-[10px] mt-1">
            Commission: ${stats?.commission.week.toLocaleString()}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-linear-to-br from-shop_orange to-orange-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/10 rounded-md">
              <DollarSign className="w-4 h-4 text-gray-900" />
            </div>
            <span className="text-gray-900/60 text-[10px]">30 days</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            ${stats?.revenue.thisMonth.toLocaleString()}
          </h3>
          <p className="text-gray-900/90 text-xs">This Month</p>
          <p className="text-gray-900/80 text-[10px] mt-1">
            Commission: ${stats?.commission.month.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-shop_dark_green hover:text-shop_light_green text-xs font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity?.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-all"
              >
                <div className="flex-1">
                  <p className="text-gray-800 text-xs font-medium">
                    Order #{order.id.slice(-6)}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {order.user?.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 text-xs font-medium">${order.totalPrice}</p>
                  <p className={`text-[10px] mt-0.5 ${
                    order.status === 'Delivered' ? 'text-shop_light_green' :
                    order.status === 'Shipped' ? 'text-shop_dark_green' :
                    order.status === 'Paid' ? 'text-shop_light_green' :
                    'text-shop_orange'
                  }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity?.recentOrders || recentActivity.recentOrders.length === 0) && (
              <p className="text-gray-500 text-center py-4 text-xs">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Users</h2>
            <Link
              href="/admin/users"
              className="text-shop_dark_green hover:text-shop_light_green text-xs font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity?.recentUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-shop_dark_green flex items-center justify-center text-white text-[10px] font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-800 text-xs">{user.email}</p>
                    <p className="text-gray-500 text-[10px]">{user.phone}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {user.isSeller && (
                    <span className="px-1.5 py-0.5 bg-shop_light_green/10 text-shop_light_green text-[10px] rounded">
                      Seller
                    </span>
                  )}
                  {user.isVerified && (
                    <CheckCircle className="w-3 h-3 text-shop_light_green" />
                  )}
                </div>
              </div>
            ))}
            {(!recentActivity?.recentUsers || recentActivity.recentUsers.length === 0) && (
              <p className="text-gray-500 text-center py-4 text-xs">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

