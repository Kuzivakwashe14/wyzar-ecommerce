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
        <p>Loading...</p>
      </div>
    );
  }

  // --- Main Dashboard Content ---
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4">
        Welcome, {user.email}
      </h1>
      
      {/* We'll add a check for verification later */}
      <div className="border p-4 border-blue-300 rounded-md mb-6">
        <p className="font-semibold">Your Seller Account</p>
        <p className="text-sm">
          Status: {user.isVerified ? 
            <span className="text-green-600 font-bold">Verified</span> : 
            <span className="text-yellow-600 font-bold">Pending Approval</span>
          }
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Seller Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Add Product */}
        <div className="border p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Manage Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add new products or view your existing inventory.
          </p>
          <div className="flex gap-2"> {/* Added flex wrapper */}
            <Link href="/dashboard/products/new" passHref>
              <Button>Add New</Button>
            </Link>
            <Link href="/dashboard/products" passHref> {/* <-- ADD THIS LINK */}
              <Button variant="outline">View All</Button>
            </Link>
          </div>
        </div>

        {/* Card 2: View Orders */}
        <div className="border p-4 rounded-lg shadow-sm ">
          <h3 className="font-semibold text-lg mb-2">View Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            See and manage all your customer orders and sales.
          </p>
          <Link href="/dashboard/orders" passHref>
            <Button>View Orders</Button>
          </Link>
        </div>

        {/* Card 3: Earnings Summary */}
        <div className="border p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Earnings Summary</h3>
          {statsLoading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Total Earnings</span>
                </div>
                <span className="font-bold text-lg text-green-600">
                  ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="font-semibold text-lg">{stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Pending Orders</span>
                </div>
                <span className="font-semibold text-lg text-orange-600">{stats.pendingOrders}</span>
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