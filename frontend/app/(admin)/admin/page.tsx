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

interface RecentActivity {
  recentOrders: any[];
  recentUsers: any[];
  recentProducts: any[];
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
        axiosInstance.get('/api/admin/stats/overview'),
        axiosInstance.get('/api/admin/stats/recent-activity')
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome to WyZar Admin Portal</p>
      </div>

      {/* Pending Actions Alert */}
      {stats && stats.users.pendingSellers > 0 && (
        <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-200 font-medium">Pending Actions Required</p>
            <p className="text-amber-300/80 text-sm mt-1">
              You have {stats.users.pendingSellers} pending seller verification(s) waiting for review
            </p>
          </div>
          <Link
            href="/admin/sellers/pending"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats?.users.total.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">Registered Users</p>
        </div>

        {/* Total Sellers */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Store className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs text-slate-500">Verified</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats?.users.sellers.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">Active Sellers</p>
          {stats && stats.users.pendingSellers > 0 && (
            <p className="text-amber-400 text-xs mt-2">
              {stats.users.pendingSellers} pending approval
            </p>
          )}
        </div>

        {/* Total Products */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs text-slate-500">Catalog</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats?.products.total.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">Total Products</p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-xs text-slate-500">All Time</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats?.orders.total.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">Total Orders</p>
          <p className="text-green-400 text-xs mt-2">
            {stats?.orders.today} today
          </p>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <Clock className="w-5 h-5 text-white/60" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats?.revenue.today.toLocaleString()}
          </h3>
          <p className="text-indigo-100 text-sm">Today's Revenue</p>
          <p className="text-indigo-200 text-xs mt-2">
            Commission: ${stats?.commission.today.toLocaleString()}
          </p>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/60 text-xs">7 days</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats?.revenue.thisWeek.toLocaleString()}
          </h3>
          <p className="text-green-100 text-sm">This Week</p>
          <p className="text-green-200 text-xs mt-2">
            Commission: ${stats?.commission.week.toLocaleString()}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/60 text-xs">30 days</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            ${stats?.revenue.thisMonth.toLocaleString()}
          </h3>
          <p className="text-purple-100 text-sm">This Month</p>
          <p className="text-purple-200 text-xs mt-2">
            Commission: ${stats?.commission.month.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-all"
              >
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    Order #{order._id.slice(-6)}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {order.user?.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">${order.totalPrice}</p>
                  <p className={`text-xs mt-1 ${
                    order.status === 'Delivered' ? 'text-green-400' :
                    order.status === 'Shipped' ? 'text-blue-400' :
                    order.status === 'Paid' ? 'text-purple-400' :
                    'text-amber-400'
                  }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity?.recentOrders || recentActivity.recentOrders.length === 0) && (
              <p className="text-slate-500 text-center py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <Link
              href="/admin/users"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.recentUsers.slice(0, 5).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm">{user.email}</p>
                    <p className="text-slate-400 text-xs">{user.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.isSeller && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                      Seller
                    </span>
                  )}
                  {user.isVerified && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            ))}
            {(!recentActivity?.recentUsers || recentActivity.recentUsers.length === 0) && (
              <p className="text-slate-500 text-center py-8">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
