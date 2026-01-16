"use client";

import { useState, useEffect } from 'react';
import { useAuth, api } from '@/context/AuthContent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';

// Define the types for our data
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  user: {
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
  paymentMethod?: 'Paynow' | 'CashOnDelivery' | 'ECOCASH' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'; // Backend returns uppercase for some
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  totalPrice: number;
}

const SellerOrdersPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        setError('You must be logged in to view orders.');
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get('/orders/seller/orders');

        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.msg || 'Failed to fetch orders.');
        }
      } catch (err: any) {
        setError(err.response?.data?.msg || 'An error occurred while fetching orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading]);

  // Helper to convert backend uppercase status to frontend title case for API calls
  const toTitleCase = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!isAuthenticated) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    try {
      const { data } = await api.put(
        `/orders/${orderId}/status`,
        { status: newStatus }
      );

      if (data.success) {
        // Optimistically update the local state with the Uppercase status returned by/expected from DB
        const upperStatus = newStatus.toUpperCase() as Order['status'];
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: upperStatus } : order
          )
        );
        toast.success(data.msg || 'Order status updated successfully!');
      } else {
        toast.error(data.msg || 'Failed to update order status.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'An error occurred.');
      console.error(err);
    }
  };

  // Handle manual payment confirmation for Paynow orders
  const handleConfirmPayment = async (orderId: string) => {
    if (!isAuthenticated) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    try {
      const { data } = await api.post(`/orders/${orderId}/confirm-payment`);

      if (data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'PAID' } : order
          )
        );
        toast.success(data.msg || 'Payment confirmed successfully!');
      } else {
        toast.error(data.msg || 'Failed to confirm payment.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'An error occurred.');
      console.error(err);
    }
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PAID':
        return 'default';
      case 'SHIPPED':
        return 'secondary';
      case 'DELIVERED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-64">Loading your orders...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p>You have no sales yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">My Revenue</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => {
                    const sellerRevenue = order.orderItems.reduce(
                      (acc, item) => acc + item.price * item.quantity,
                      0
                    );

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          #{order.id.substring(0, 7)}...
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{order.user.email}</TableCell>
                        <TableCell>
                          <ul className="min-w-[200px]">
                            {order.orderItems.map((item, index) => (
                              <li key={index}>
                                {item.name} (x{item.quantity})
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="text-right">
                          ${sellerRevenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Confirm Payment - for Pending orders */}
                              {order.status === 'PENDING' && (
                                <DropdownMenuItem
                                  onClick={() => handleConfirmPayment(order.id)}
                                  className="text-green-600"
                                >
                                  ✓ Confirm Payment
                                </DropdownMenuItem>
                              )}
                              
                              {/* Mark as Paid (Legacy/Alternative) */}
                              {order.paymentMethod === 'CASH_ON_DELIVERY' && 
                               ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(order.id, 'Paid')}
                                >
                                  ✓ Confirm Payment Received
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'Shipped')}
                                disabled={
                                  order.status === 'SHIPPED' || 
                                  order.status === 'DELIVERED' ||
                                  order.status === 'PENDING'
                                }
                              >
                                Mark as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                                disabled={order.status !== 'SHIPPED'}
                              >
                                Mark as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                                disabled={
                                  order.status === 'CANCELLED' || 
                                  order.status === 'DELIVERED' ||
                                  order.status === 'SHIPPED'
                                }
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrdersPage;

