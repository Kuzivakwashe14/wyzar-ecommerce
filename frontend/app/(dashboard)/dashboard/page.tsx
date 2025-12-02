// In frontend/app/(dashboard)/dashboard/page.tsx
"use client";

import { useAuth, api } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Clock } from "lucide-react";

interface SellerStats {
  totalEarnings: number;
  totalOrders: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // --- Fetch Seller Stats ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || !user?.isSeller) {
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        const { data } = await api.get('/orders/seller/stats');
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching seller stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading && isAuthenticated && user?.isSeller) {
      fetchStats();
    }
  }, [isAuthenticated, user, loading]);

  // --- Page Protection ---
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login"); // Not logged in
      } else if (!user?.isSeller) {
        router.push("/become-a-seller"); // Not a seller
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // --- Show Loading State ---
  if (loading || !user || !user.isSeller) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Content ---
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4 text-shop_dark_green">
        Welcome, {user.email}
      </h1>
      
      {/* We'll add a check for verification later */}
      <div className="border-2 p-4 border-shop_light_green/30 bg-shop_light_green/5 rounded-lg mb-6">
        <p className="font-semibold text-shop_dark_green">Your Seller Account</p>
        <p className="text-sm">
          Status: {user.isVerified ? 
            <span className="text-shop_light_green font-bold">Verified</span> : 
            <span className="text-shop_orange font-bold">Pending Approval</span>
          }
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-shop_dark_green">Seller Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Add Product */}
        <div className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2 text-shop_dark_green">Manage Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add new products or view your existing inventory.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/products/new" passHref>
              <Button className="bg-shop_dark_green hover:bg-shop_light_green">Add New</Button>
            </Link>
            <Link href="/dashboard/products" passHref>
              <Button variant="outline" className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white">View All</Button>
            </Link>
          </div>
        </div>

        {/* Card 2: View Orders */}
        <div className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2 text-shop_dark_green">View Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            See and manage all your customer orders and sales.
          </p>
          <Link href="/dashboard/orders" passHref>
            <Button className="bg-shop_dark_green hover:bg-shop_light_green">View Orders</Button>
          </Link>
        </div>

        {/* Card 3: Earnings Summary */}
        <div className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2 text-shop_dark_green">Earnings Summary</h3>
          {statsLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-shop_dark_green border-t-transparent"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-shop_light_green" />
                  <span className="text-sm text-gray-600">Total Earnings</span>
                </div>
                <span className="font-bold text-lg text-shop_light_green">
                  ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-shop_dark_green" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="font-semibold text-lg">{stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-shop_orange" />
                  <span className="text-sm text-gray-600">Pending Orders</span>
                </div>
                <span className="font-semibold text-lg text-shop_orange">{stats.pendingOrders}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No data available</p>
          )}
        </div>

      </div>
    </div>
  );
}