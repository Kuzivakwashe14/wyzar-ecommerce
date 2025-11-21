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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define the Order type
interface Order {
  _id: string;
  orderItems: {
    _id: string;
    name: string;
    quantity: number;
    image: string;
    price: number;
  }[];
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
  };
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
    return <div className="flex justify-center items-center min-h-screen"><p>Loading orders...</p></div>;
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
        return <Badge className="bg-green-500 text-white">{status}</Badge>;
      case 'Pending':
        return <Badge variant="secondary">{status}</Badge>;
      case 'Shipped':
        return <Badge className="bg-blue-500 text-white">{status}</Badge>;
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
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">You have not placed any orders yet.</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {orders.map((order) => (
            <AccordionItem value={order._id} key={order._id}>
              
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4">
                  <div>
                    <p className="font-semibold">Order ID: {order._id.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(order.status)}
                    <p className="font-semibold text-lg">
                      ${order.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="border-t">
                <div className="pt-4 space-y-4">
                  {/* Order Items */}
                  {order.orderItems.map((item) => (
                    <div key={item._id} className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                        <Image
                          src={`${API_BASE_URL}/${item.image.replace(/\\/g, '/')}`}
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
                      <p className="text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  {/* Shipping Details */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Shipping To:</h4>
                    <p className="text-sm">{order.shippingAddress.fullName}</p>
                    <p className="text-sm">{order.shippingAddress.address}</p>
                    <p className="text-sm">{order.shippingAddress.city}</p>
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