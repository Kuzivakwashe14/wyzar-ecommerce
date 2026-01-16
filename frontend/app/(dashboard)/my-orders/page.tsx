// In frontend/app/(dashboard)/my-orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth, api } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils";

// Define the Order type (Prisma format)
interface Order {
  id: string;
  orderItems: {
    id: string;
    name: string;
    quantity: number;
    image: string;
    price: number;
  }[];
  shippingFullName: string;
  shippingAddress: string;
  shippingCity: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Protect page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // 2. Fetch orders
  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const res = await api.get("/orders/myorders");
          setOrders(res.data);
        } catch (err) {
          console.error("Failed to fetch orders:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-shop_light_green text-white">{status}</Badge>;
      case 'Pending':
        return <Badge className="bg-shop_orange/20 text-shop_orange border-shop_orange">{status}</Badge>;
      case 'Shipped':
        return <Badge className="bg-shop_dark_green text-white">{status}</Badge>;
      case 'Delivered':
        return <Badge className="bg-gray-700 text-white">{status}</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-8 text-shop_dark_green">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600">You have not placed any orders yet.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {orders.map((order) => (
            <AccordionItem value={order.id} key={order.id} className="bg-white rounded-xl border border-gray-200 px-4">
              
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between w-full pr-4">
                  <div className="text-left">
                    <p className="font-semibold text-shop_dark_green">Order ID: {order.id.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(order.status)}
                    <p className="font-semibold text-lg text-shop_orange">
                      ${order.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="border-t border-gray-200">
                <div className="pt-4 space-y-4">
                  {/* Order Items */}
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={true}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-shop_dark_green">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  {/* Shipping Details */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold mb-2 text-shop_dark_green">Shipping To:</h4>
                    <p className="text-sm text-gray-600">{order.shippingFullName}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                    <p className="text-sm text-gray-600">{order.shippingCity}</p>
                  </div>
                </div>
              </AccordionContent>
              
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
