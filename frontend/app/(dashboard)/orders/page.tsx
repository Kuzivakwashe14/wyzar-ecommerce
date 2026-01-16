"use client";

import { useEffect, useState } from "react";
import { useAuth, api } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
  };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await api.get("/orders/myorders");
        setOrders(response.data);
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.msg || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-shop_dark_green">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-shop_dark_green">My Orders</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-shop_dark_green">My Orders</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
            <Button asChild className="bg-shop_dark_green hover:bg-shop_dark_green/90">
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-shop_dark_green">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-gray-50 py-3 px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <Package className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Order placed</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[order.status] || "bg-gray-100"}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Badge className={paymentStatusColors[order.paymentStatus] || "bg-gray-100"}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Order Items Preview */}
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 rounded-lg border-2 border-white bg-gray-100 overflow-hidden relative"
                    >
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        +{order.items.length - 3}
                      </span>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    Shipping to: {order.shippingAddress.city}
                  </p>
                </div>

                {/* Total & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <p className="text-lg font-bold text-shop_dark_green">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/orders/${order._id}`}>
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
