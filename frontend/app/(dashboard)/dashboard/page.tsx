// In frontend/app/(dashboard)/dashboard/page.tsx
"use client";

import { useAuth, api } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SellerStats {
  totalEarnings: number;
  totalOrders: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading, login, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

    if (!loading && isAuthenticated && user?.isSeller && !user?.isSuspended) {
      fetchStats();
    } else if (user?.isSuspended) {
      setStatsLoading(false);
    }
  }, [isAuthenticated, user, loading]);

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to DELETE your seller account? This will remove all your products and seller details. This action cannot be undone.")) return;

    try {
      setDeleteLoading(true);
      await api.delete("/seller/delete-account");
      toast.success("Seller account deleted successfully.");
      await refreshUser();
      router.push("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.msg || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Page Protection ---
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        login(); // Not logged in
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-terracotta border-t-transparent mx-auto mb-4"></div>
          <p className="text-brown-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Content ---
  return (
    <div className="container mx-auto py-12 px-4 bg-cream min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-brown">
        Welcome, {user.email}
      </h1>
      
      {/* Status Banner */}
      <div className={`border-2 p-6 rounded-2xl mb-8 ${
        user.isSuspended 
          ? "border-red-200 bg-red-50" 
          : "border-sage/30 bg-sage/5"
      }`}>
        <div className="flex items-center justify-between">
          <div>
             <h2 className={`text-lg font-bold mb-1 ${user.isSuspended ? "text-red-700" : "text-brown"}`}>
              {user.isSuspended ? "Account Suspended" : "Seller Account Status"}
            </h2>
             <p className="text-sm">
              Status: {user.isSuspended ? (
                  <span className="text-red-600 font-bold">Suspended</span>
              ) : user.isVerified ? (
                <span className="text-sage font-bold">Verified</span> 
              ) : (
                <span className="text-terracotta font-bold">Pending Approval</span>
              )}
            </p>
            {user.isSuspended && user.suspensionReason && (
              <div className="mt-3 p-3 bg-white/50 rounded-md border border-red-100">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> {user.suspensionReason}
                </p>
              </div>
            )}
          </div>
          {user.isSuspended ? (
             <ShieldAlert className="h-12 w-12 text-red-500 opacity-20" />
          ) : (
             <Package className="h-12 w-12 text-brown opacity-20" />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-brown">Seller Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Add Product */}
        <div className="border border-line p-6 rounded-2xl shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '20px' }}>
          <h3 className="font-semibold text-lg mb-2 text-brown">Manage Products</h3>
          <p className="text-sm text-brown-light mb-4">
            Add new products or view your existing inventory.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/products/new" passHref>
              <Button className="bg-terracotta hover:bg-brown text-white rounded-full">Add New</Button>
            </Link>
            <Link href="/dashboard/products" passHref>
              <Button variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">View All</Button>
            </Link>
          </div>
        </div>

        {/* Card 2: View Orders */}
        <div className="border border-line p-6 rounded-2xl shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '20px' }}>
          <h3 className="font-semibold text-lg mb-2 text-brown">View Orders</h3>
          <p className="text-sm text-brown-light mb-4">
            See and manage all your customer orders and sales.
          </p>
          <Link href="/dashboard/orders" passHref>
            <Button className="bg-terracotta hover:bg-brown text-white rounded-full">View Orders</Button>
          </Link>
        </div>

        {/* Card 3: Earnings Summary */}
        <div className="border border-line p-6 rounded-2xl shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '20px' }}>
          <h3 className="font-semibold text-lg mb-2 text-brown">Earnings Summary</h3>
          {statsLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-terracotta border-t-transparent"></div>
              <p className="text-sm text-brown-light">Loading...</p>
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-sage" />
                  <span className="text-sm text-brown-light">Total Earnings</span>
                </div>
                <span className="font-bold text-lg text-sage">
                  ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-brown" />
                  <span className="text-sm text-brown-light">Total Orders</span>
                </div>
                <span className="font-semibold text-lg">{stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-terracotta" />
                  <span className="text-sm text-brown-light">Pending Orders</span>
                </div>
                <span className="font-semibold text-lg text-terracotta">{stats.pendingOrders}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brown-light">No data available</p>
          )}
        </div>

      </div>


    </div>
  );
}
